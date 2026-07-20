type AnimatedParticleProps = {
  pathId: string;
  delaySeconds: number;
  color: string;
};

/** A small glowing dot that periodically travels along an active branch's path, via native SVG
 *  SMIL animateMotion, cheap, GPU-friendly, and needs no per-frame JS. `keyPoints`/`keyTimes`
 *  reverse the default start→end traversal so it travels from the oldest end up toward the
 *  branch's most recent point, matching the graph's newest-at-top reading direction. */
export default function AnimatedParticle({ pathId, delaySeconds, color }: AnimatedParticleProps) {
  return (
    <circle className="career-particle" r={3} style={{ color }}>
      <animateMotion
        dur="5s"
        begin={`${delaySeconds}s`}
        repeatCount="indefinite"
        rotate="auto"
        keyPoints="1;0"
        keyTimes="0;1"
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.08;0.85;1"
        dur="5s"
        begin={`${delaySeconds}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}
