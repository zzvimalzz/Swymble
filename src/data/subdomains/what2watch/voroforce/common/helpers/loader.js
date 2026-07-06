import { CustomEventTarget } from '../../utils/custom-event-target'

class LoaderEvent extends Event {
  constructor(name, data) {
    super(name ?? 'loaded')
    this.data = data
  }
}

export class Loader extends CustomEventTarget {
  constructor(sharedLoadedMediaVersionLayersData, config) {
    super()

    this.sharedLoadedMediaVersionLayersData =
      sharedLoadedMediaVersionLayersData?.sharedLoadedMediaVersionLayersData
    this.config = config.media

    this.loadedIndex = 0
    this.loadingMediaLayers = 0
  }

  preloadAllMediaLayersVersion0(onLoad) {
    const count = this.config.versions[0].layers
    let loaded = 0
    const onLoadLayer = () => {
      loaded++
      if (loaded === count) {
        this.dispatchEvent(new LoaderEvent('preloaded'))
        onLoad?.()
      }
    }
    for (let i = 0; i < count; i++) {
      void this.loadMediaLayer(0, i, onLoadLayer)
    }
  }

  preloadFirstMediaLayerAllGridVersions(onLoad) {
    const count = this.config.versions.filter(
      ({ type }) => !type || type === 'compressed-grid',
    ).length
    let loaded = 0
    const onLoadLayer = () => {
      loaded++
      if (loaded === count) {
        this.dispatchEvent(new LoaderEvent('preloaded'))
        onLoad?.()
      }
    }
    for (let i = 0; i < count; i++) {
      const type = this.config.versions[i].type
      if (type && type !== 'compressed-grid') continue
      void this.loadMediaLayer(i, 0, onLoadLayer)
    }
  }

  async loadMediaLayer(versionIndex, layerIndex, onLoad) {
    if (
      this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] !==
      0
    )
      return

    // mark as loading synchronously, BEFORE any await: layer requests arrive
    // every simulation tick and an async src resolution (e.g. dynamic poster
    // URLs) would otherwise kick off duplicate fetches for the same layer
    this.loadingMediaLayers++
    this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] = 1

    const baseUrl = this.config.baseUrl
    const config = this.config.versions[versionIndex]
    const ext =
      !config.type || config.type === 'compressed-grid'
        ? this.config.compressionFormat
        : undefined

    let src
    if (typeof config.layerSrcFormat === 'function') {
      src = await config.layerSrcFormat(layerIndex, this.store)
    } else {
      src = `${config.layerSrcFormat.startsWith('/') ? baseUrl : ''}${config.layerSrcFormat
        .replaceAll('{INDEX}', `${(config.layerIndexStart ?? 0) + layerIndex}`)
        .replaceAll('{EXT}', ext)}`
    }

    if (!src) {
      // nothing to load for this layer - it stays marked so it isn't
      // re-requested every simulation tick
      this.loadingMediaLayers--
      this.checkFinish()
      return
    }

    let bytes
    const type = config.type ?? 'compressed-grid'

    const isDds = ext === 'dds'
    const isKtx = ext === 'ktx'

    if (isDds) {
      // DDS File format constants
      const MAGIC = 0x20534444
      const DDPF_FOURCC = 0x4

      // DXT compression formats
      const FOURCC_DXT1 = 0x31545844

      const response = await fetch(src)
      const arrayBuffer = await response.arrayBuffer()
      const header = new Int32Array(arrayBuffer, 0, 31)

      // Verify magic number
      if (header[0] !== MAGIC) {
        console.log('src', src)
        throw new Error('Invalid DDS file format')
      }

      const height = header[3]
      // const width = header[2]
      const width = header[4]
      const pixelFormat = header[20]

      // Check compression type
      if (!(pixelFormat & DDPF_FOURCC)) {
        throw new Error('Unsupported DDS format: not compressed')
      }

      const fourCC = header[21]
      const blockSize = 8

      if (fourCC !== FOURCC_DXT1) {
        throw new Error('Unsupported DDS format: not DXT1')
      }

      // Calculate size and load texture data
      const size =
        (((Math.max(4, width) / 4) * Math.max(4, height)) / 4) * blockSize

      bytes = new Uint8Array(arrayBuffer, 128, size) // 128 is size of DDS header
    } else if (isKtx) {
      const response = await fetch(src)
      const arrayBuffer = await response.arrayBuffer()

      const idCheck = [
        0xab, 0x4b, 0x54, 0x58, 0x20, 0x31, 0x31, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
      ]
      const id = new Uint8Array(arrayBuffer, 0, 12)
      for (let i = 0; i < id.length; i++)
        if (id[i] !== idCheck[i])
          return console.error('File missing KTX identifier')

      const size = Uint32Array.BYTES_PER_ELEMENT
      const head = new DataView(arrayBuffer, 12, 13 * size)
      const littleEndian = head.getUint32(0, true) === 0x04030201
      const glType = head.getUint32(size, littleEndian)
      if (glType !== 0) {
        throw new Error('only compressed formats currently supported')
      }
      // this.glInternalFormat = head.getUint32(4 * size, littleEndian)
      // const width = head.getUint32(6 * size, littleEndian)
      // const height = head.getUint32(7 * size, littleEndian)
      // this.numberOfFaces = head.getUint32(10 * size, littleEndian)
      // this.numberOfMipmapLevels = Math.max(
      //   1,
      //   head.getUint32(11 * size, littleEndian),
      // )
      const bytesOfKeyValueData = head.getUint32(12 * size, littleEndian)

      let offset = 12 + 13 * 4 + bytesOfKeyValueData
      const levelSize = new Int32Array(arrayBuffer, offset, 1)[0]
      offset += 4 // levelSize field
      bytes = new Uint8Array(arrayBuffer, offset, levelSize)
    } else {
      try {
        bytes = await this.loadUncompressedTile(src, config)
      } catch (e) {
        // remote poster failed (network/CORS) - leave the layer marked as
        // pending so it isn't re-requested in a loop; the affected cell
        // simply keeps its current atlas tile
        this.loadingMediaLayers--
        this.checkFinish()
        return
      }
    }

    this.loadedIndex++
    this.dispatchEvent(
      new LoaderEvent('mediaLayerLoaded', {
        bytes,
        versionIndex,
        layerIndex,
        type,
        isCompressed: isDds,
      }),
    )

    this.sharedLoadedMediaVersionLayersData[versionIndex].data[layerIndex] = 2

    onLoad?.()

    this.loadingMediaLayers--

    this.checkFinish()
  }

  checkFinish() {
    if (this.loadingMediaLayers === 0) {
      this.dispatchEvent(new LoaderEvent('idle'))
    }
  }

  // Fetches a single (uncompressed) tile image and, when the media version
  // declares fixed tile dimensions, cover-fits it onto a canvas of exactly
  // that size - required because texSubImage3D uploads a fixed-size region
  // and remote poster CDNs (TMDB/TVmaze) serve arbitrary dimensions.
  async loadUncompressedTile(src, config) {
    const blob = await (await fetch(src)).blob()
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(img.src)
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error('Failed to load image'))
      }
      img.src = URL.createObjectURL(blob)
    })

    const { tileWidth, tileHeight } = config
    if (
      !tileWidth ||
      !tileHeight ||
      (image.width === tileWidth && image.height === tileHeight)
    ) {
      return image
    }

    const canvas = document.createElement('canvas')
    canvas.width = tileWidth
    canvas.height = tileHeight
    const ctx = canvas.getContext('2d')
    const scale = Math.max(tileWidth / image.width, tileHeight / image.height)
    const scaledWidth = image.width * scale
    const scaledHeight = image.height * scale
    ctx.drawImage(
      image,
      (tileWidth - scaledWidth) / 2,
      (tileHeight - scaledHeight) / 2,
      scaledWidth,
      scaledHeight,
    )
    return canvas
  }

  requestMediaLayerLoad(versionIndex, layers) {
    layers.forEach((layerIndex) => {
      if (
        this.sharedLoadedMediaVersionLayersData[versionIndex].data[
          layerIndex
        ] === 0
      ) {
        void this.loadMediaLayer(versionIndex, layerIndex)
      }
    })
  }

  load(src, onLoad) {
    let mediaElement
    let loadEventName
    if (src.endsWith('.mp4')) {
      loadEventName = 'onplay'
      mediaElement = document.createElement('video')
      mediaElement.autoplay = true
      mediaElement.loop = true
      mediaElement.muted = true
      mediaElement.playsInline = true
      mediaElement.crossOrigin = 'anonymous'
      mediaElement.src = src
      void mediaElement.play()
    } else {
      loadEventName = 'onload'
      mediaElement = new Image()
      mediaElement.src = src
      mediaElement.crossOrigin = 'anonymous'
    }

    mediaElement[loadEventName] = () => {
      this.dispatchEvent(new LoaderEvent('loaded', mediaElement))
      onLoad?.(mediaElement)
    }
  }
}
