/* ============================================================
   data.js — curated, best-effort historical reference data.
   These are hand-compiled facts (top film, defining song,
   head of government). They're real but, unlike the live feeds,
   labelled "from our archive" in the UI so nothing is passed
   off as a per-day lookup.
   ============================================================ */

/* ---------- highest-grossing / defining film by release year ---------- */
export const MOVIES_BY_YEAR = {
  1940: "Pinocchio", 1941: "Sergeant York", 1942: "Mrs. Miniver", 1943: "This Is the Army",
  1944: "Going My Way", 1945: "The Bells of St. Mary's", 1946: "The Best Years of Our Lives",
  1947: "Forever Amber", 1948: "The Red Shoes", 1949: "Samson and Delilah",
  1950: "Cinderella", 1951: "Quo Vadis", 1952: "The Greatest Show on Earth", 1953: "The Robe",
  1954: "White Christmas", 1955: "Lady and the Tramp", 1956: "The Ten Commandments",
  1957: "The Bridge on the River Kwai", 1958: "South Pacific", 1959: "Ben-Hur",
  1960: "Spartacus", 1961: "One Hundred and One Dalmatians", 1962: "Lawrence of Arabia",
  1963: "Cleopatra", 1964: "Mary Poppins", 1965: "The Sound of Music", 1966: "Doctor Zhivago",
  1967: "The Jungle Book", 1968: "2001: A Space Odyssey", 1969: "Butch Cassidy and the Sundance Kid",
  1970: "Love Story", 1971: "Fiddler on the Roof", 1972: "The Godfather", 1973: "The Exorcist",
  1974: "The Towering Inferno", 1975: "Jaws", 1976: "Rocky", 1977: "Star Wars",
  1978: "Grease", 1979: "Kramer vs. Kramer", 1980: "The Empire Strikes Back",
  1981: "Raiders of the Lost Ark", 1982: "E.T. the Extra-Terrestrial", 1983: "Return of the Jedi",
  1984: "Ghostbusters", 1985: "Back to the Future", 1986: "Top Gun", 1987: "Three Men and a Baby",
  1988: "Rain Man", 1989: "Batman", 1990: "Home Alone", 1991: "Terminator 2: Judgment Day",
  1992: "Aladdin", 1993: "Jurassic Park", 1994: "The Lion King", 1995: "Toy Story",
  1996: "Independence Day", 1997: "Titanic", 1998: "Armageddon", 1999: "Star Wars: The Phantom Menace",
  2000: "Mission: Impossible 2", 2001: "Harry Potter and the Philosopher's Stone",
  2002: "The Lord of the Rings: The Two Towers", 2003: "The Lord of the Rings: The Return of the King",
  2004: "Shrek 2", 2005: "Harry Potter and the Goblet of Fire",
  2006: "Pirates of the Caribbean: Dead Man's Chest", 2007: "Pirates of the Caribbean: At World's End",
  2008: "The Dark Knight", 2009: "Avatar", 2010: "Toy Story 3",
  2011: "Harry Potter and the Deathly Hallows – Part 2", 2012: "The Avengers", 2013: "Frozen",
  2014: "Transformers: Age of Extinction", 2015: "Star Wars: The Force Awakens",
  2016: "Captain America: Civil War", 2017: "Star Wars: The Last Jedi",
  2018: "Avengers: Infinity War", 2019: "Avengers: Endgame", 2020: "Demon Slayer: Mugen Train",
  2021: "Spider-Man: No Way Home", 2022: "Avatar: The Way of Water", 2023: "Barbie",
  2024: "Inside Out 2", 2025: "Ne Zha 2"
};

/* ---------- defining #1 song by year (US year-end / global icon) ---------- */
export const SONGS_BY_YEAR = {
  1940: "I'll Never Smile Again — Tommy Dorsey", 1941: "Chattanooga Choo Choo — Glenn Miller",
  1942: "White Christmas — Bing Crosby", 1943: "I've Heard That Song Before — Harry James",
  1944: "Swinging on a Star — Bing Crosby", 1945: "Rum and Coca-Cola — The Andrews Sisters",
  1946: "Prisoner of Love — Perry Como", 1947: "Near You — Francis Craig",
  1948: "Twelfth Street Rag — Pee Wee Hunt", 1949: "Riders in the Sky — Vaughn Monroe",
  1950: "Goodnight Irene — The Weavers", 1951: "Too Young — Nat King Cole",
  1952: "Blue Tango — Leroy Anderson", 1953: "Song from Moulin Rouge — Percy Faith",
  1954: "Little Things Mean a Lot — Kitty Kallen", 1955: "Cherry Pink and Apple Blossom White — Pérez Prado",
  1956: "Heartbreak Hotel — Elvis Presley", 1957: "All Shook Up — Elvis Presley",
  1958: "Nel blu dipinto di blu (Volare) — Domenico Modugno", 1959: "Mack the Knife — Bobby Darin",
  1960: "Theme from A Summer Place — Percy Faith", 1961: "Tossin' and Turnin' — Bobby Lewis",
  1962: "Stranger on the Shore — Acker Bilk", 1963: "Sugar Shack — Jimmy Gilmer and the Fireballs",
  1964: "I Want to Hold Your Hand — The Beatles", 1965: "Wooly Bully — Sam the Sham and the Pharaohs",
  1966: "The Ballad of the Green Berets — SSgt Barry Sadler", 1967: "To Sir, with Love — Lulu",
  1968: "Hey Jude — The Beatles", 1969: "Sugar, Sugar — The Archies",
  1970: "Bridge over Troubled Water — Simon & Garfunkel", 1971: "Joy to the World — Three Dog Night",
  1972: "The First Time Ever I Saw Your Face — Roberta Flack", 1973: "Tie a Yellow Ribbon — Tony Orlando and Dawn",
  1974: "The Way We Were — Barbra Streisand", 1975: "Love Will Keep Us Together — Captain & Tennille",
  1976: "Silly Love Songs — Wings", 1977: "Tonight's the Night — Rod Stewart",
  1978: "Shadow Dancing — Andy Gibb", 1979: "My Sharona — The Knack",
  1980: "Call Me — Blondie", 1981: "Bette Davis Eyes — Kim Carnes",
  1982: "Physical — Olivia Newton-John", 1983: "Every Breath You Take — The Police",
  1984: "When Doves Cry — Prince", 1985: "Careless Whisper — George Michael",
  1986: "That's What Friends Are For — Dionne & Friends", 1987: "Walk Like an Egyptian — The Bangles",
  1988: "Faith — George Michael", 1989: "Look Away — Chicago",
  1990: "Hold On — Wilson Phillips", 1991: "(Everything I Do) I Do It for You — Bryan Adams",
  1992: "End of the Road — Boyz II Men", 1993: "I Will Always Love You — Whitney Houston",
  1994: "The Sign — Ace of Base", 1995: "Gangsta's Paradise — Coolio",
  1996: "Macarena — Los del Río", 1997: "Candle in the Wind 1997 — Elton John",
  1998: "Too Close — Next", 1999: "Believe — Cher",
  2000: "Breathe — Faith Hill", 2001: "Hanging by a Moment — Lifehouse",
  2002: "How You Remind Me — Nickelback", 2003: "In da Club — 50 Cent",
  2004: "Yeah! — Usher feat. Lil Jon & Ludacris", 2005: "We Belong Together — Mariah Carey",
  2006: "Bad Day — Daniel Powter", 2007: "Irreplaceable — Beyoncé",
  2008: "Low — Flo Rida feat. T-Pain", 2009: "Boom Boom Pow — The Black Eyed Peas",
  2010: "Tik Tok — Kesha", 2011: "Rolling in the Deep — Adele",
  2012: "Somebody That I Used to Know — Gotye feat. Kimbra", 2013: "Thrift Shop — Macklemore & Ryan Lewis",
  2014: "Happy — Pharrell Williams", 2015: "Uptown Funk — Mark Ronson feat. Bruno Mars",
  2016: "Love Yourself — Justin Bieber", 2017: "Shape of You — Ed Sheeran",
  2018: "God's Plan — Drake", 2019: "Old Town Road — Lil Nas X feat. Billy Ray Cyrus",
  2020: "Blinding Lights — The Weeknd", 2021: "Levitating — Dua Lipa",
  2022: "As It Was — Harry Styles", 2023: "Flowers — Miley Cyrus",
  2024: "A Bar Song (Tipsy) — Shaboozey"
};

/* ---------- heads of government / state, by country (ISO2) ---------- */
// { name, title, from, to } — `to: null` means still in office.
export const LEADERS = {
  US: { country: "United States", list: [
    ["Franklin D. Roosevelt", "President", 1933, 1945], ["Harry S. Truman", "President", 1945, 1953],
    ["Dwight D. Eisenhower", "President", 1953, 1961], ["John F. Kennedy", "President", 1961, 1963],
    ["Lyndon B. Johnson", "President", 1963, 1969], ["Richard Nixon", "President", 1969, 1974],
    ["Gerald Ford", "President", 1974, 1977], ["Jimmy Carter", "President", 1977, 1981],
    ["Ronald Reagan", "President", 1981, 1989], ["George H. W. Bush", "President", 1989, 1993],
    ["Bill Clinton", "President", 1993, 2001], ["George W. Bush", "President", 2001, 2009],
    ["Barack Obama", "President", 2009, 2017], ["Donald Trump", "President", 2017, 2021],
    ["Joe Biden", "President", 2021, 2025], ["Donald Trump", "President", 2025, null]
  ]},
  GB: { country: "United Kingdom", list: [
    ["Neville Chamberlain", "Prime Minister", 1937, 1940], ["Winston Churchill", "Prime Minister", 1940, 1945],
    ["Clement Attlee", "Prime Minister", 1945, 1951], ["Winston Churchill", "Prime Minister", 1951, 1955],
    ["Anthony Eden", "Prime Minister", 1955, 1957], ["Harold Macmillan", "Prime Minister", 1957, 1963],
    ["Alec Douglas-Home", "Prime Minister", 1963, 1964], ["Harold Wilson", "Prime Minister", 1964, 1970],
    ["Edward Heath", "Prime Minister", 1970, 1974], ["Harold Wilson", "Prime Minister", 1974, 1976],
    ["James Callaghan", "Prime Minister", 1976, 1979], ["Margaret Thatcher", "Prime Minister", 1979, 1990],
    ["John Major", "Prime Minister", 1990, 1997], ["Tony Blair", "Prime Minister", 1997, 2007],
    ["Gordon Brown", "Prime Minister", 2007, 2010], ["David Cameron", "Prime Minister", 2010, 2016],
    ["Theresa May", "Prime Minister", 2016, 2019], ["Boris Johnson", "Prime Minister", 2019, 2022],
    ["Liz Truss", "Prime Minister", 2022, 2022], ["Rishi Sunak", "Prime Minister", 2022, 2024],
    ["Keir Starmer", "Prime Minister", 2024, null]
  ]},
  MY: { country: "Malaysia", list: [
    ["Tunku Abdul Rahman", "Prime Minister", 1957, 1970], ["Abdul Razak Hussein", "Prime Minister", 1970, 1976],
    ["Hussein Onn", "Prime Minister", 1976, 1981], ["Mahathir Mohamad", "Prime Minister", 1981, 2003],
    ["Abdullah Ahmad Badawi", "Prime Minister", 2003, 2009], ["Najib Razak", "Prime Minister", 2009, 2018],
    ["Mahathir Mohamad", "Prime Minister", 2018, 2020], ["Muhyiddin Yassin", "Prime Minister", 2020, 2021],
    ["Ismail Sabri Yaakob", "Prime Minister", 2021, 2022], ["Anwar Ibrahim", "Prime Minister", 2022, null]
  ]},
  SG: { country: "Singapore", list: [
    ["Lee Kuan Yew", "Prime Minister", 1959, 1990], ["Goh Chok Tong", "Prime Minister", 1990, 2004],
    ["Lee Hsien Loong", "Prime Minister", 2004, 2024], ["Lawrence Wong", "Prime Minister", 2024, null]
  ]},
  IN: { country: "India", list: [
    ["Jawaharlal Nehru", "Prime Minister", 1947, 1964], ["Lal Bahadur Shastri", "Prime Minister", 1964, 1966],
    ["Indira Gandhi", "Prime Minister", 1966, 1977], ["Morarji Desai", "Prime Minister", 1977, 1979],
    ["Charan Singh", "Prime Minister", 1979, 1980], ["Indira Gandhi", "Prime Minister", 1980, 1984],
    ["Rajiv Gandhi", "Prime Minister", 1984, 1989], ["V. P. Singh", "Prime Minister", 1989, 1990],
    ["Chandra Shekhar", "Prime Minister", 1990, 1991], ["P. V. Narasimha Rao", "Prime Minister", 1991, 1996],
    ["H. D. Deve Gowda", "Prime Minister", 1996, 1997], ["I. K. Gujral", "Prime Minister", 1997, 1998],
    ["Atal Bihari Vajpayee", "Prime Minister", 1998, 2004], ["Manmohan Singh", "Prime Minister", 2004, 2014],
    ["Narendra Modi", "Prime Minister", 2014, null]
  ]},
  CA: { country: "Canada", list: [
    ["W. L. Mackenzie King", "Prime Minister", 1935, 1948], ["Louis St. Laurent", "Prime Minister", 1948, 1957],
    ["John Diefenbaker", "Prime Minister", 1957, 1963], ["Lester B. Pearson", "Prime Minister", 1963, 1968],
    ["Pierre Trudeau", "Prime Minister", 1968, 1979], ["Joe Clark", "Prime Minister", 1979, 1980],
    ["Pierre Trudeau", "Prime Minister", 1980, 1984], ["Brian Mulroney", "Prime Minister", 1984, 1993],
    ["Kim Campbell", "Prime Minister", 1993, 1993], ["Jean Chrétien", "Prime Minister", 1993, 2003],
    ["Paul Martin", "Prime Minister", 2003, 2006], ["Stephen Harper", "Prime Minister", 2006, 2015],
    ["Justin Trudeau", "Prime Minister", 2015, 2025], ["Mark Carney", "Prime Minister", 2025, null]
  ]},
  AU: { country: "Australia", list: [
    ["Ben Chifley", "Prime Minister", 1945, 1949], ["Robert Menzies", "Prime Minister", 1949, 1966],
    ["Harold Holt", "Prime Minister", 1966, 1967], ["John Gorton", "Prime Minister", 1968, 1971],
    ["William McMahon", "Prime Minister", 1971, 1972], ["Gough Whitlam", "Prime Minister", 1972, 1975],
    ["Malcolm Fraser", "Prime Minister", 1975, 1983], ["Bob Hawke", "Prime Minister", 1983, 1991],
    ["Paul Keating", "Prime Minister", 1991, 1996], ["John Howard", "Prime Minister", 1996, 2007],
    ["Kevin Rudd", "Prime Minister", 2007, 2010], ["Julia Gillard", "Prime Minister", 2010, 2013],
    ["Kevin Rudd", "Prime Minister", 2013, 2013], ["Tony Abbott", "Prime Minister", 2013, 2015],
    ["Malcolm Turnbull", "Prime Minister", 2015, 2018], ["Scott Morrison", "Prime Minister", 2018, 2022],
    ["Anthony Albanese", "Prime Minister", 2022, null]
  ]},
  FR: { country: "France", list: [
    ["Charles de Gaulle", "President", 1959, 1969], ["Georges Pompidou", "President", 1969, 1974],
    ["Valéry Giscard d'Estaing", "President", 1974, 1981], ["François Mitterrand", "President", 1981, 1995],
    ["Jacques Chirac", "President", 1995, 2007], ["Nicolas Sarkozy", "President", 2007, 2012],
    ["François Hollande", "President", 2012, 2017], ["Emmanuel Macron", "President", 2017, null]
  ]},
  DE: { country: "Germany", list: [
    ["Konrad Adenauer", "Chancellor", 1949, 1963], ["Ludwig Erhard", "Chancellor", 1963, 1966],
    ["Kurt Georg Kiesinger", "Chancellor", 1966, 1969], ["Willy Brandt", "Chancellor", 1969, 1974],
    ["Helmut Schmidt", "Chancellor", 1974, 1982], ["Helmut Kohl", "Chancellor", 1982, 1998],
    ["Gerhard Schröder", "Chancellor", 1998, 2005], ["Angela Merkel", "Chancellor", 2005, 2021],
    ["Olaf Scholz", "Chancellor", 2021, 2025], ["Friedrich Merz", "Chancellor", 2025, null]
  ]},
  JP: { country: "Japan", list: [
    ["Hayato Ikeda", "Prime Minister", 1960, 1964], ["Eisaku Satō", "Prime Minister", 1964, 1972],
    ["Kakuei Tanaka", "Prime Minister", 1972, 1974], ["Takeo Miki", "Prime Minister", 1974, 1976],
    ["Takeo Fukuda", "Prime Minister", 1976, 1978], ["Masayoshi Ōhira", "Prime Minister", 1978, 1980],
    ["Zenkō Suzuki", "Prime Minister", 1980, 1982], ["Yasuhiro Nakasone", "Prime Minister", 1982, 1987],
    ["Noboru Takeshita", "Prime Minister", 1987, 1989], ["Junichiro Koizumi", "Prime Minister", 2001, 2006],
    ["Shinzō Abe", "Prime Minister", 2006, 2007], ["Yasuo Fukuda", "Prime Minister", 2007, 2008],
    ["Tarō Asō", "Prime Minister", 2008, 2009], ["Yukio Hatoyama", "Prime Minister", 2009, 2010],
    ["Naoto Kan", "Prime Minister", 2010, 2011], ["Yoshihiko Noda", "Prime Minister", 2011, 2012],
    ["Shinzō Abe", "Prime Minister", 2012, 2020], ["Yoshihide Suga", "Prime Minister", 2020, 2021],
    ["Fumio Kishida", "Prime Minister", 2021, 2024], ["Shigeru Ishiba", "Prime Minister", 2024, null]
  ]},
  CN: { country: "China", list: [
    ["Mao Zedong", "Paramount Leader", 1949, 1976], ["Hua Guofeng", "Paramount Leader", 1976, 1978],
    ["Deng Xiaoping", "Paramount Leader", 1978, 1989], ["Jiang Zemin", "Paramount Leader", 1989, 2002],
    ["Hu Jintao", "Paramount Leader", 2002, 2012], ["Xi Jinping", "Paramount Leader", 2012, null]
  ]},
  RU: { country: "Russia / USSR", list: [
    ["Joseph Stalin", "Leader", 1924, 1953], ["Nikita Khrushchev", "Leader", 1953, 1964],
    ["Leonid Brezhnev", "Leader", 1964, 1982], ["Yuri Andropov", "Leader", 1982, 1984],
    ["Konstantin Chernenko", "Leader", 1984, 1985], ["Mikhail Gorbachev", "Leader", 1985, 1991],
    ["Boris Yeltsin", "President", 1991, 1999], ["Vladimir Putin", "President", 1999, 2008],
    ["Dmitry Medvedev", "President", 2008, 2012], ["Vladimir Putin", "President", 2012, null]
  ]},
  BR: { country: "Brazil", list: [
    ["José Sarney", "President", 1985, 1990], ["Fernando Collor", "President", 1990, 1992],
    ["Itamar Franco", "President", 1992, 1995], ["Fernando Henrique Cardoso", "President", 1995, 2003],
    ["Luiz Inácio Lula da Silva", "President", 2003, 2011], ["Dilma Rousseff", "President", 2011, 2016],
    ["Michel Temer", "President", 2016, 2019], ["Jair Bolsonaro", "President", 2019, 2023],
    ["Luiz Inácio Lula da Silva", "President", 2023, null]
  ]},
  NZ: { country: "New Zealand", list: [
    ["Helen Clark", "Prime Minister", 1999, 2008], ["John Key", "Prime Minister", 2008, 2016],
    ["Bill English", "Prime Minister", 2016, 2017], ["Jacinda Ardern", "Prime Minister", 2017, 2023],
    ["Chris Hipkins", "Prime Minister", 2023, 2023], ["Christopher Luxon", "Prime Minister", 2023, null]
  ]},
  IE: { country: "Ireland", list: [
    ["Bertie Ahern", "Taoiseach", 1997, 2008], ["Brian Cowen", "Taoiseach", 2008, 2011],
    ["Enda Kenny", "Taoiseach", 2011, 2017], ["Leo Varadkar", "Taoiseach", 2017, 2020],
    ["Micheál Martin", "Taoiseach", 2020, 2022], ["Leo Varadkar", "Taoiseach", 2022, 2024],
    ["Simon Harris", "Taoiseach", 2024, 2025], ["Micheál Martin", "Taoiseach", 2025, null]
  ]},
  ZA: { country: "South Africa", list: [
    ["Nelson Mandela", "President", 1994, 1999], ["Thabo Mbeki", "President", 1999, 2008],
    ["Kgalema Motlanthe", "President", 2008, 2009], ["Jacob Zuma", "President", 2009, 2018],
    ["Cyril Ramaphosa", "President", 2018, null]
  ]}
};

/** Look up the leader of a country (by ISO2 code) for a given year. */
export function leaderAt(countryCode, year) {
  const entry = LEADERS[(countryCode || "").toUpperCase()];
  if (!entry) return null;
  // prefer the matching term with the latest start year
  const matches = entry.list
    .map(([name, title, from, to]) => ({ name, title, from, to }))
    .filter((l) => l.from <= year && (l.to === null || year <= l.to))
    .sort((a, b) => b.from - a.from);
  if (!matches.length) return null;
  return { ...matches[0], country: entry.country };
}

/** The full ordered list of a country's leaders (for the timeline). */
export function leadersOf(countryCode) {
  const entry = LEADERS[(countryCode || "").toUpperCase()];
  if (!entry) return null;
  return {
    country: entry.country,
    list: entry.list.map(([name, title, from, to]) => ({ name, title, from, to }))
  };
}

// the handful of world powers we show side-by-side for a given year
const WORLD_POWERS = ["US", "GB", "RU", "CN", "IN", "JP"];
export function leadersThatYear(year, excludeCode) {
  const ex = (excludeCode || "").toUpperCase();
  return WORLD_POWERS.filter((c) => c !== ex).map((code) => {
    const l = leaderAt(code, year);
    return {
      code,
      country: LEADERS[code].country,
      name: l ? l.name : null,
      title: l ? l.title : null
    };
  });
}

export function movieOfYear(year) { return MOVIES_BY_YEAR[year] || null; }
export function songOfYear(year) { return SONGS_BY_YEAR[year] || null; }

/* ---------- world population (billions), UN estimates, interpolated ---------- */
const WORLD_POP = {
  1940: 2.30, 1945: 2.34, 1950: 2.54, 1955: 2.77, 1960: 3.03, 1965: 3.34,
  1970: 3.70, 1975: 4.08, 1980: 4.46, 1985: 4.87, 1990: 5.33, 1995: 5.74,
  2000: 6.14, 2005: 6.54, 2010: 6.96, 2015: 7.43, 2020: 7.84, 2025: 8.09
};
export function worldPopulationAt(year) {
  const yrs = Object.keys(WORLD_POP).map(Number).sort((a, b) => a - b);
  if (year <= yrs[0]) return WORLD_POP[yrs[0]] * 1e9;
  if (year >= yrs[yrs.length - 1]) return WORLD_POP[yrs[yrs.length - 1]] * 1e9;
  for (let i = 0; i < yrs.length - 1; i++) {
    if (year >= yrs[i] && year <= yrs[i + 1]) {
      const t = (year - yrs[i]) / (yrs[i + 1] - yrs[i]);
      return (WORLD_POP[yrs[i]] + t * (WORLD_POP[yrs[i + 1]] - WORLD_POP[yrs[i]])) * 1e9;
    }
  }
  return null;
}

/* ---------- country list for the datalist ---------- */
export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bangladesh",
  "Belgium", "Bolivia", "Brazil", "Bulgaria", "Cambodia", "Cameroon", "Canada", "Chile",
  "China", "Colombia", "Croatia", "Cuba", "Czech Republic", "Denmark", "Ecuador", "Egypt",
  "Estonia", "Ethiopia", "Finland", "France", "Germany", "Ghana", "Greece", "Hong Kong",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon",
  "Lithuania", "Luxembourg", "Malaysia", "Mexico", "Morocco", "Myanmar", "Nepal",
  "Netherlands", "New Zealand", "Nigeria", "North Korea", "Norway", "Pakistan", "Palestine",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia",
  "Serbia", "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain",
  "Sri Lanka", "Sweden", "Switzerland", "Syria", "Taiwan", "Tanzania", "Thailand", "Tunisia",
  "Turkey", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Venezuela", "Vietnam", "Yemen", "Zimbabwe"
];
