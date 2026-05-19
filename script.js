/* ============================================================
   LingoLevels — main script
   - State (texts, dictionary, favourites, settings) in localStorage.
   - Designed so each chunk can later be swapped for a backend call.
   ============================================================ */

// ---------- Constants ----------
const LS_KEYS = {
  TEXTS:      'lingolevels.texts',
  DICT:       'lingolevels.dictionary',
  FAVS:       'lingolevels.favourites',
  SETTINGS:   'lingolevels.settings',
  SRS:        'lingolevels.srs',
  ENCOUNTERS: 'lingolevels.encounters',
  STATS:      'lingolevels.stats',
};
// One-time migration from the original "levelup.*" prefix → "lingolevels.*".
(function migrateLsKeys() {
  Object.values(LS_KEYS).forEach(newKey => {
    const oldKey = newKey.replace(/^lingolevels\./, 'levelup.');
    if (oldKey !== newKey && localStorage.getItem(oldKey) !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey));
    }
  });
})();
const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const LANG_LABEL = { en:'English', ru:'Русский', de:'Deutsch', fr:'Français' };
const LANG_FLAG  = { en:'🇬🇧', ru:'🇷🇺', de:'🇩🇪', fr:'🇫🇷' };

// Browse-panel filter state — chips on/off, free-text search.
const browseFilters = {
  languages: new Set(),  // empty = all
  levels:    new Set(),  // empty = all
  withImage: false,
  withPL:    false,
  search:    ''
};

// ---------- Seed data ----------

// Shared Polish translation for the "Smartphone trap" article — used by all 4 language versions
// since the content is the same article translated into different source languages.
const SMARTPHONE_PL = {
  A1: `Telefon jest mały. Wiele dzieci ma telefon. Rodzice się cieszą. Dziecko jest spokojne. Dziecko nie płacze. Ale to nie jest dobre. Dziecko cały dzień jest przy telefonie. Dziecko się nie bawi. Dziecko nie rozmawia z przyjaciółmi. Telefon pokazuje wiele rzeczy. Niektóre rzeczy są złe dla dzieci. Dzieci muszą czytać książki. Dzieci muszą się bawić. Dzieci muszą rozmawiać z rodziną. Telefon jest czasem w porządku. Ale nie cały dzień.`,
  A2: `Dziś wiele małych dzieci ma smartfon. Rodzice często myślą, że to dobra rzecz. Kiedy dziecko jest zajęte telefonem, rodzice mają czas na odpoczynek. Dziecko jest spokojne i nie wymaga uwagi. Ale to może być problemem. Dzieci używają telefonów za dużo. Oglądają filmy przez wiele godzin. Zapominają bawić się z innymi dziećmi. Zapominają czytać książki. Niektóre filmy nie są odpowiednie dla dzieci. Rodzice nie zawsze wiedzą, co oglądają ich dzieci. Dzieci potrzebują pomocy od rodziców, aby właściwie korzystać z telefonu.`,
  B1: `Dla wielu rodziców danie smartfona dziecku wydaje się być świetnym rozwiązaniem. Kiedy dziecko jest zajęte telefonem, przestaje płakać, przestaje zadawać pytania i przestaje przeszkadzać dorosłym. Rodzic w końcu ma chwilę spokoju. Jednak ten krótki moment ciszy może szybko przerodzić się w poważny problem. Kiedy dzieci spędzają zbyt wiele godzin na telefonach każdego dnia, mogą rozwinąć u siebie pewnego rodzaju uzależnienie. Tracą zainteresowanie prawdziwymi zajęciami, przyjaciółmi, a nawet rodziną. To, co czyni sytuację jeszcze bardziej niebezpieczną, to fakt, że rodzice często nie wiedzą, co ich dzieci oglądają w internecie. Sieć jest pełna treści, które nie są bezpieczne dla młodych ludzi: brutalnych filmów, szkodliwych wiadomości i fałszywych wyobrażeń o świecie. Statystyki z krajów takich jak Wielka Brytania pokazują, że problemy ze zdrowiem psychicznym wśród młodzieży się pogarszają, a wielu ekspertów uważa, że smartfony odgrywają w tym znaczącą rolę. Technologia jest pożyteczna, ale tylko wtedy, gdy używamy jej mądrze.`,
  B2: `Dla wielu rodziców wręczenie smartfona niespokojnemu dziecku wydaje się idealnym rozwiązaniem. Płacz ustaje, pytania milkną, a nieustanne żądania uwagi w końcu cichną. Przez kilka cennych minut, a nawet godzin, w domu zapanowuje spokój. Jednak ta pozorna chwila spokoju może łatwo przerodzić się w coś o wiele bardziej niepokojącego: rodzaj uzależnienia, które ma niektóre cechy bardziej znanych nałogów. Choć nadmierne używanie smartfona nie jest tym samym co uzależnienie od alkoholu lub narkotyków, długotrwałe i niekontrolowane wystawienie na cyfrowe treści może mieć poważny wpływ na rozwój psychiczny dziecka. Jeszcze bardziej niepokojący jest fakt, że bez odpowiedniego nadzoru dzieci i nastolatki są wystawiane na materiały, które mogą całkowicie zniekształcić ich rozumienie świata, relacji społecznych i ich własnej tożsamości. Niepokojące dane z Wielkiej Brytanii jasno ilustrują tę tendencję: wskaźniki lęku, depresji i innych problemów psychicznych wśród nastolatków stale rosną, a wielu specjalistów wskazuje na urządzenia cyfrowe jako główny czynnik. W przeszłości szkoły zajmowały się głównie skutkami przemocy domowej lub innych trudnych sytuacji rodzinnych, które dzieci przynosiły z domu. Dziś do tej listy dołączył smartfon. Bez nadzoru rodzicielskiego daje on nieograniczony dostęp do niemal niewyobrażalnej ilości nieodpowiednich treści: brutalnych, seksualnych, manipulacyjnych lub po prostu destrukcyjnych. A najbardziej niepokojące jest to, że rodzice często nie mają pojęcia, co ich dzieci po cichu oglądają za ekranem. Jak każde potężne narzędzie, smartfony mają swoje zalety, ale tylko świadome i odpowiedzialne korzystanie może uchronić nas przed katastrofą.`,
  C1: `Dla wyczerpanych rodziców wręczenie smartfona niespokojnemu dziecku może wydawać się niczym mniej jak cudem. Krzyki cichną, niekończące się żądania uwagi rozpływają się, a nad domem zalega kruche milczenie. Dziecko wygląda na zajęte, bezpiecznie zabawione i, co kluczowe, nie przeszkadza już nikomu. A jednak to, co wygląda na ciężko wywalczoną chwilę spokoju, częściej niż nie okazuje się pierwszym krokiem w stronę czegoś znacznie bardziej niepokojącego: cichej, lecz uporczywej formy uzależnienia, która wykazuje kilka charakterystycznych cech bardziej klasycznych uzależnień. Choć nadmierne korzystanie ze smartfona nie jest, ściśle rzecz biorąc, równoznaczne z nadużywaniem substancji, długotrwałe i pozbawione nadzoru spożywanie cyfrowych treści może wywierać głęboko niekorzystny wpływ na rozwój emocjonalny i poznawczy dziecka. Jeszcze bardziej niepokojący jest fakt, że brak jakiegokolwiek sensownego nadzoru nad tym, z czym dzieci i nastolatki rzeczywiście stykają się w sieci, może zniekształcić ich postrzeganie świata, podważyć ich zdolność do budowania zdrowych więzi społecznych i nadwerężyć ich i tak już kruche poczucie własnej tożsamości. Niepokojące dane płynące z Wielkiej Brytanii, gdzie wskaźniki depresji, lęku i samookaleczeń wśród młodych ludzi nadal rosną w alarmującym tempie, oferują w tej kwestii niewiele pocieszenia. Tam, gdzie poprzednie pokolenia nauczycieli wzywano do zajmowania się skutkami przemocy domowej i różnymi dysfunkcjami życia rodzinnego, dzisiejsi pedagodzy stoją przed dodatkowym i znacznie bardziej podstępnym przeciwnikiem: samym smartfonem. Bez nadzoru, to małe urządzenie daje nieskrępowany dostęp do niemal niewyobrażalnej ilości nieodpowiedniego materiału — treści, które są brutalne, zseksualizowane, manipulacyjne lub w inny sposób niszczące dla rozwijającego się umysłu. I, co być może najbardziej niepokojące ze wszystkiego, rodzice często nie zdają sobie sprawy, co ich dzieci po cichu chłoną w prywatności własnych pokoi, gdzie blask ekranu pozostaje jedynym świadkiem ich przeżyć. Każda potężna technologia oczywiście niesie zarówno korzyści, jak i ryzyko. Tylko przemyślane, wyważone i konsekwentnie nadzorowane korzystanie pozwala nam mieć nadzieję na czerpanie prawdziwych korzyści z urządzeń cyfrowych, nie padając ofiarą ich licznych zagrożeń.`,
  C2: `Dla zmęczonego, pozbawionego snu rodzica smartfon często prezentuje się z całą uwodzicielską łatwością deus ex machina: wystarczy wręczyć urządzenie krnąbrnemu dziecku, a w ciągu kilku sekund krzyki cichną, nieustępliwe żądania zaangażowania rozpływają się w skupionym na ekranie milczeniu, a dom, wbrew wszelkim rozsądnym oczekiwaniom, osiada w czymś, co przypomina spokój. Dziecko wygląda na zadowolone, wręcz produktywnie pochłonięte; dorosły, miłosiernie uwolniony, odzyskuje skrawek tej autonomii, którą rodzicielstwo tak uporczywie konfiskuje. A jednak, jak to bywa z tak wieloma transakcjami zawartymi pod przymusem, warunki tego porozumienia mają w zwyczaju ujawniać się dopiero później — i rzadko na warunkach, jakie rodzic świadomie by zaakceptował. To, co na powierzchni jawi się jako trwały mechanizm przywracania domowej równowagi, w rzeczywistości, z niepokojącą regularnością, okazuje się pierwszym ruchem procesu, którego zakończenie ma więcej niż przelotne podobieństwo do uzależnienia w jego bardziej klasycznych postaciach. Twierdzić, że kompulsywne używanie smartfona jest dokładnie analogiczne do uzależnienia od substancji psychoaktywnych, byłoby przesadą; leżąca u podstaw neurochemia, kontekst społeczny i trajektorie wyzdrowienia różnią się w ważnych aspektach. Niemniej jednak długotrwała, nieregulowana i w dużej mierze pozbawiona nadzoru ekspozycja dzieci na cyfrowe treści jest dziś szeroko rozumiana jako wywierająca na rozwijające się umysły efekty, w najlepszym razie ambiwalentne, a w najgorszym głęboko żrące — obejmujące skrócone okresy uwagi, zubożone umiejętności społeczne, rozbitą architekturę snu i z deprymującą regularnością powolną erozję odporności emocjonalnej. Jeszcze bardziej niepokojące jest pytanie — zbyt rzadko stawiane z należną mu pilnością — o to, co dokładnie dzieci i nastolatki napotykają, gdy ekran znajdzie się w ich rękach, a drzwi zamkną się za nimi. Bez czujnego pośrednictwa uważnego dorosłego cyfrowy krajobraz rozpościera się przed nimi jako terytorium jednocześnie ekscytujące i zdradliwe: miejsce, w którym starannie wyselekcjonowane dezinformacje, materiały pornograficzne o narastającej intensywności, manipulacyjne treści ideologiczne i nieustępliwy strumień wizerunków napędzanych porównaniami rywalizują o rozwijającą się wyobraźnię. Konsekwencje, jak można się spodziewać, można dostrzec w zniekształconych wyobrażeniach o rzeczywistości, w skarłowaciałych zdolnościach do prawdziwego kontaktu społecznego i w bolesnej dezorientacji tożsamościowej, która coraz bardziej charakteryzuje doświadczenie adolescencji. Statystyki płynące z Wielkiej Brytanii w ostatnich latach — rosnące wskaźniki depresji, zaburzeń lękowych, samookaleczeń i myśli samobójczych wśród młodych — mówią językiem o brutalnej elokwencji, którego żaden odpowiedzialny obserwator nie może ignorować. Pokolenie temu szkolny korytarz służył jako nieszczęsny pojemnik, do którego nieuchronnie przelewano przemoc, zaniedbanie i dysfunkcję sfery domowej; czujny nauczyciel mógł często rozpoznać w posiniaczonym ramieniu lub nieobecnym spojrzeniu ciche ślady trudnego domu. Dzisiaj ten znajomy repertuar krzywd został uzupełniony — a w wielu przypadkach przyćmiony — przez zjawisko, którego kontury nauczyciele, rodzice i klinicyści wciąż próbują nakreślić: wszechobecny, niezapośredniczony i niemal niewyczerpany wpływ smartfona. I być może najbardziej niepokojącą cechą tej nowej rzeczywistości jest jej zasadniczo niewidzialny charakter. Tam, gdzie przeszłe formy krzywdy ogłaszały się słyszalną kłótnią lub widoczną raną, obecne pokolenie zagrożeń rozwija się w absolutnej ciszy, za skromną barierą zamkniętych drzwi sypialni, pod miękkim, uporczywym blaskiem ekranu, którego obrazów żaden dorosły nie pomyślał, nie odważył się ani nie wiedział, by sprawdzić. To frazes, i to prawdziwy, że żadna potężna technologia nie jest sama w sobie ani dobra, ani zła; smartfon nie jest wyjątkiem. Ale pozostawienie tak doniosłego instrumentu bez moderacji w rękach tych, którzy są najmniej przygotowani do nawigowania jego zagrożeń, to w istocie zrzeczenie się jednej z bardziej wymagających odpowiedzialności, jakie pociąga za sobą rodzicielstwo. Tylko poprzez kultywowaną uważność, świadomą regulację i — przede wszystkim — utrzymaną uwagę dorosłych możemy mieć nadzieję zachować dla naszych dzieci prawdziwe i znaczne korzyści, jakie te urządzenia bez wątpienia oferują, oszczędzając im jednocześnie powolnej katastrofy, do której nienadzorowane cyfrowe dzieciństwo, jak się obecnie z niepokojącą jasnością wydaje, zaprasza.`
};

const SEED_TEXTS = [{
  id: 'demo-en-strange-day',
  title: 'A strange day at school',
  language: 'en',
  levels: {
    A1: "It is Monday. Tom goes to school. His bag is big. The sun is hot. At school, Tom sees a cat. The cat is on his desk. Tom is happy. He gives the cat some milk. The teacher comes in. She is not angry. She likes the cat too.",

    A2: "On Monday morning, Tom walked to school with his big bag. The sun was very hot that day. When he arrived at school, he saw something strange. There was a small grey cat sitting on his desk. Tom was surprised but happy. He gave the cat some milk from his lunchbox. When his teacher walked in, she didn't get angry. She smiled and said, 'What a lovely cat!'",

    B1: "It was a sunny Monday morning when Tom set off for school, carrying his usual heavy bag. He didn't expect anything unusual to happen, but as he walked into the classroom, he stopped in surprise. A small grey cat was lying on his desk, looking at him calmly. Tom couldn't believe his eyes. He quickly opened his lunchbox and offered the cat some milk, which it drank eagerly. Just as he was wondering how to explain things, his teacher came in. To his relief, she wasn't angry at all. Instead, she laughed and said the cat could stay for the day.",

    B2: "It was an unusually warm Monday morning, and Tom was making his way to school with his oversized backpack slung over one shoulder. He had no reason to expect anything out of the ordinary, but the moment he stepped into the classroom, he froze. Curled up on his desk was a small grey cat, regarding him with an air of complete indifference. Without thinking twice, Tom rummaged through his lunchbox, pulled out a carton of milk, and poured a little into the lid. As the cat lapped it up contentedly, his teacher walked in. He braced himself for a scolding, but to his astonishment, she burst out laughing and declared the cat their classroom guest for the day.",

    C1: "It was one of those deceptively pleasant Monday mornings, the kind that lulls you into believing the day will pass without incident. Tom strolled towards school, his backpack weighing him down as usual, his thoughts drifting between the upcoming maths test and the lingering aftertaste of his hurried breakfast. Yet the moment he crossed the threshold of his classroom, all such preoccupations evaporated. Perched serenely on his desk, as though it owned the place, sat a small grey cat. Caught off guard but unwilling to make a scene, Tom fished out a small carton of milk from his lunchbox and poured a modest amount into the lid. The cat, evidently a connoisseur of such offerings, accepted it with the dignity of a minor royal. When the teacher entered, Tom braced himself for a reprimand. Instead, she let out a hearty laugh and announced that the cat would be the class's honorary guest for the day.",

    C2: "There are mornings whose sheer ordinariness lulls even the most vigilant observer into a state of complacency, and that particular Monday was, by all outward appearances, indistinguishable from any other. Tom trudged towards school beneath the weight of an absurdly overstuffed backpack, his mind half-occupied with the impending maths examination, half-adrift in the residual stupor of an inadequate breakfast. Whatever modest expectations he had nurtured for the day were summarily upended the instant he set foot in the classroom. There, ensconced atop his desk with the proprietorial air of a creature who had patently never entertained the notion of trespass, lay a small grey cat. Stifling the impulse to draw attention to this most extraordinary intruder, Tom discreetly excavated a modest carton of milk from the depths of his lunchbox and decanted a measured portion into its plastic lid. The animal, evidently no stranger to such hospitality, addressed itself to the offering with the languid grace of an aristocrat at table. The teacher's eventual entrance was met by Tom with the resigned fatalism of one prepared for censure; instead, she dissolved into mirth and pronounced, with theatrical solemnity, that the cat should henceforth be regarded as their honoured guest."
  },
  translations: {
    pl: {
      A1: `Jest poniedziałek. Tom idzie do szkoły. Jego torba jest duża. Słońce jest gorące. W szkole Tom widzi kota. Kot jest na jego biurku. Tom jest szczęśliwy. Daje kotu trochę mleka. Wchodzi nauczycielka. Nie jest zła. Ona też lubi kota.`,
      A2: `W poniedziałek rano Tom poszedł do szkoły ze swoją dużą torbą. Słońce było tego dnia bardzo gorące. Kiedy dotarł do szkoły, zobaczył coś dziwnego. Na jego biurku siedział mały szary kot. Tom był zaskoczony, ale szczęśliwy. Dał kotu trochę mleka ze swojego pudełka śniadaniowego. Kiedy nauczycielka weszła, nie zezłościła się. Uśmiechnęła się i powiedziała: „Co za uroczy kot!"`,
      B1: `Był słoneczny poniedziałkowy poranek, kiedy Tom wyruszył do szkoły, niosąc swoją zwykłą ciężką torbę. Nie spodziewał się, że stanie się coś niezwykłego, ale kiedy wszedł do klasy, zatrzymał się ze zdziwienia. Mały szary kot leżał na jego biurku i spokojnie patrzył mu w oczy. Tom nie mógł uwierzyć własnym oczom. Szybko otworzył swoje pudełko śniadaniowe i podał kotu trochę mleka, które ten chętnie wypił. Akurat kiedy zastanawiał się, jak to wszystko wytłumaczyć, do klasy weszła nauczycielka. Ku jego uldze, wcale nie była zła. Wręcz przeciwnie, roześmiała się i powiedziała, że kot może zostać na cały dzień.`,
      B2: `Był to niezwykle ciepły poniedziałkowy poranek, a Tom szedł do szkoły, niosąc swój zbyt duży plecak przewieszony przez jedno ramię. Nie miał powodu spodziewać się niczego niezwykłego, ale w chwili, gdy wszedł do klasy, zamarł. Na jego biurku, zwinięty w kłębek, leżał mały szary kot i patrzył na niego z miną wyrażającą całkowitą obojętność. Nie zastanawiając się dwa razy, Tom przeszukał swoje pudełko śniadaniowe, wyciągnął karton mleka i nalał trochę do nakrętki. Kiedy kot z zadowoleniem chłeptał napój, do klasy weszła nauczycielka. Tom przygotował się na reprymendę, ale ku jego zdumieniu wybuchnęła śmiechem i oznajmiła, że kot zostanie ich klasowym gościem na cały dzień.`,
      C1: `Był to jeden z tych zwodniczo przyjemnych poniedziałkowych poranków, jeden z tych, które usypiają czujność i każą wierzyć, że dzień minie bez żadnych niespodzianek. Tom szedł powoli w stronę szkoły, plecak jak zwykle ciążył mu na ramieniu, a myśli krążyły między zbliżającym się sprawdzianem z matematyki a niknącym posmakiem pośpiesznie zjedzonego śniadania. A jednak w chwili, gdy przekroczył próg klasy, wszystkie te zaprzątające go troski wyparowały. Na jego biurku, w pełnej godności pozie — jakby należało do niego od zawsze — siedział spokojnie mały szary kot. Zaskoczony, lecz nie chcąc robić zamieszania, Tom wyłowił z pudełka śniadaniowego mały karton mleka i nalał skromną ilość do nakrętki. Kot, najwyraźniej znawca takich poczęstunków, przyjął go z dostojeństwem godnym pomniejszego władcy. Kiedy weszła nauczycielka, Tom przygotował się wewnętrznie na naganę. Ona jednak parsknęła serdecznym śmiechem i ogłosiła, że kot będzie honorowym gościem klasy na cały dzień.`,
      C2: `Bywają poranki, których czysta zwyczajność usypia czujność nawet najbaczniejszego obserwatora i wprowadza go w stan beztroskiej pewności siebie — i ów konkretny poniedziałek był, przynajmniej na pierwszy rzut oka, nie do odróżnienia od jakiegokolwiek innego. Tom wlókł się w stronę szkoły pod ciężarem absurdalnie wypchanego plecaka, a jego umysł błądził połowicznie między nadciągającym sprawdzianem z matematyki a resztkowym osłupieniem po niedostatecznym śniadaniu. Wszelkie skromne oczekiwania, jakie żywił wobec tego dnia, zostały bezceremonialnie zburzone w chwili, gdy postawił stopę w klasie. Tam, ulokowany na blacie jego biurka z miną właściciela — jak istota, której najwidoczniej nigdy nie postała w głowie myśl o przekroczeniu cudzych granic — leżał mały szary kot. Tłumiąc odruch zwrócenia uwagi na tego niezwykłego intruza, Tom dyskretnie wydobył z czeluści pudełka śniadaniowego niewielki karton mleka i odmierzył skromną porcję do plastikowej nakrętki. Zwierzę, najwyraźniej obeznane z taką formą gościnności, przystąpiło do oferowanego napoju z ospałą gracją arystokraty zasiadającego do stołu. Późniejsze wejście nauczycielki Tom przyjął z rezygnowaną fatalistycznością kogoś przygotowanego na naganę; ona jednak rozpłynęła się w wesołości i z teatralną powagą ogłosiła, że kot powinien odtąd być traktowany jak ich honorowy gość.`
    }
  },
  questions: {
    tprs: [
      { q: "Does Tom go to school on Monday?", a: "Yes, he does." },
      { q: "Is the cat on the desk or on the chair?", a: "On the desk." },
      { q: "Who walks into the classroom?", a: "The teacher." },
      { q: "Where does Tom find the cat?", a: "On his desk." },
      { q: "What does Tom give to the cat?", a: "Some milk." },
      { q: "Why isn't the teacher angry?", a: "Because she likes the cat too." },
      { q: "Have you ever found an animal in an unusual place?", a: "" }
    ],
    comprehension: [
      { type: 'mc', q: "What did Tom find on his desk?",
        options: ["A dog", "A grey cat", "His teacher", "A book"], correct: 1 },
      { type: 'tf', q: "The teacher got angry when she saw the cat.", correct: false },
      { type: 'short', q: "What did Tom give the cat?", a: "milk" },
      { type: 'open', q: "How did the teacher react when she saw the cat? Explain in your own words." }
    ]
  },
  audio: { A1:null, A2:null, B1:null, B2:null, C1:null, C2:null }
},
{
  id: 'demo-ru-park',
  title: 'Странная встреча в парке',
  language: 'ru',
  levels: {
    A1: `Сегодня суббота. Анна идёт в парк. Погода хорошая. В парке она видит старика. Старик сидит на скамейке. У него большая шляпа. Он читает книгу. Анна говорит: «Здравствуйте». Старик улыбается. Он даёт Анне яблоко. Анна говорит: «Спасибо».`,

    A2: `В прошлую субботу Анна пошла в парк. Погода была тёплой и солнечной. Возле фонтана она увидела старика в большой чёрной шляпе. Он сидел на скамейке и читал старую книгу. Анна подошла и поздоровалась. Старик улыбнулся и дал ей красное яблоко из своего кармана. «Это волшебное яблоко», — сказал он тихо. Анна засмеялась и поблагодарила его.`,

    B1: `Однажды в субботу Анна решила пойти в парк, чтобы немного отдохнуть. День был тёплый, и в парке было много людей. Возле старого фонтана она заметила пожилого человека в большой чёрной шляпе. Он сидел совершенно один и читал книгу с пожелтевшими страницами. Что-то в нём показалось Анне знакомым, хотя она была уверена, что никогда раньше его не встречала. Когда она подошла поближе, старик поднял глаза и улыбнулся, словно ждал её. Он молча достал из кармана красное яблоко и протянул ей. «Возьми, — сказал он, — оно тебе пригодится». Анна не нашлась что ответить и просто кивнула в знак благодарности.`,

    B2: `В одну из суббот Анна, уставшая после долгой рабочей недели, отправилась прогуляться в городской парк. Светило по-летнему мягкое солнце, в воздухе пахло свежескошенной травой, и казалось, ничто не предвещало необычных событий. Однако возле заброшенного фонтана её внимание привлёк пожилой мужчина в чёрной широкополой шляпе, который, словно не замечая никого вокруг, сосредоточенно читал ветхую книгу. Что-то в его облике заставило Анну остановиться. Она подошла ближе и нерешительно поздоровалась. Старик медленно поднял глаза, и в его взгляде мелькнуло выражение, которое Анна не смогла истолковать — то ли узнавание, то ли лёгкая печаль. Не сказав ни слова, он достал из кармана пальто красное яблоко и протянул ей. «Тебе оно понадобится скоро», — произнёс он негромко, и эти слова отчего-то заставили её сердце забиться чаще.`,

    C1: `Тот субботний день начинался ничем не примечательно: после изнурительной рабочей недели Анне хотелось лишь немного покоя, и она направилась в старый парк, что располагался на окраине города. Солнце светило мягко, словно сквозь тонкую вуаль, лёгкий ветерок едва касался листвы, и общее настроение было умиротворённым, почти усыпляющим. Однако возле полузаросшего фонтана, в котором уже давно не плескалась вода, Анна заметила фигуру, выбивавшуюся из этой пасторальной картины. Пожилой мужчина в чёрной широкополой шляпе, надвинутой на лоб, сидел в одиночестве на потрескавшейся скамейке и был всецело погружён в чтение книги, чьи страницы пожелтели от времени. Что-то неуловимое в его осанке привлекло её внимание и удержало на месте, хотя поначалу она и не собиралась задерживаться. Когда Анна, повинуясь странному порыву, подошла ближе и поздоровалась, старик медленно, словно нехотя, поднял на неё глаза. Во взгляде его читалась смесь смутного узнавания, лёгкой горечи и какого-то неуместного в эту минуту ожидания. Не проронив ни слова, он извлёк из глубины пальто красное яблоко — на удивление свежее для столь раннего утра — и молча протянул его Анне. «Возьми, — наконец произнёс он голосом, в котором сквозила усталость целой жизни, — оно тебе скоро понадобится». И, словно сказав всё, что должен был сказать, вновь склонился над книгой.`,

    C2: `Тот субботний день начинался обманчиво буднично: после изматывающей рабочей недели Анна направилась в старый парк на окраине города в надежде обрести несколько часов столь желанного покоя. Воздух был напоён тем неуловимым ароматом ранней осени, в котором смешиваются прелая листва, далёкий дым и обещание скорых холодов. Однако, проходя мимо давно заброшенного фонтана, чьи каменные дельфины растрескались от десятилетий равнодушия, Анна вдруг остановилась — не вследствие какой-либо отчётливой причины, но повинуясь тому смутному предчувствию, что порой настигает нас на пороге чего-то, чему мы пока не дали имени. На покосившейся скамье сидел пожилой господин в чёрной шляпе, надвинутой едва ли не до самых бровей, погружённый в чтение фолианта, страницы которого, пожелтевшие от времени, казалось, вот-вот рассыплются от прикосновения. Было нечто во всей его фигуре — в том, как он держал книгу, словно она была живым существом, в той замершей, почти иконографической неподвижности, — что заставило Анну, человека, по природе своей склонного к деликатной отстранённости, приблизиться и нарушить молчание сдержанным приветствием. Старик не сразу отозвался: вначале он словно вынырнул из глубин текста, а уж затем, медленно подняв взор, остановил его на ней с выражением, которое невозможно было разложить на простые составляющие — смесью узнавания, не имевшего, по всей видимости, реальных оснований, тихой грусти, столь укоренившейся, что она уже не казалась эмоцией, и спокойного, почти церемонного ожидания. Не проронив ни слова, он извлёк из-под полы пальто алое, нелепо свежее посреди этой пожухлой осени яблоко и протянул его Анне. «Возьми, — произнёс он тихо, и голос его звучал так, словно нёс в себе тяжесть многих несказанных лет, — оно тебе вскоре пригодится». И, как будто сочтя долг исполненным, склонился вновь над раскрытой книгой, оставив Анну стоять в недоумении, сжимая в ладони неожиданный дар.`
  },
  questions: {
    tprs: [
      { q: "Куда идёт Анна в субботу?", a: "В парк." },
      { q: "Что делает старик в парке?", a: "Сидит на скамейке и читает книгу." },
      { q: "Что носит старик на голове — шляпу или шапку?", a: "Шляпу." },
      { q: "Какого цвета шляпа старика?", a: "Чёрная." },
      { q: "Что даёт старик Анне?", a: "Красное яблоко." },
      { q: "Анна знает старика?", a: "Нет, она его не знает." },
      { q: "А ты часто гуляешь в парке?", a: "" }
    ],
    comprehension: [
      { type:'mc', q: "Где Анна встречает старика?",
        options:["Дома","В парке","В магазине","В школе"], correct: 1 },
      { type:'tf', q: "Старик сердится на Анну.", correct: false },
      { type:'mc', q: "Что старик даёт Анне?",
        options:["Книгу","Деньги","Яблоко","Цветок"], correct: 2 },
      { type:'open', q: "Как ты думаешь, почему старик сказал «оно тебе пригодится»?" }
    ]
  },
  translations: {
    pl: {
      A1: `Dziś jest sobota. Anna idzie do parku. Pogoda jest dobra. W parku widzi starszego mężczyznę. Mężczyzna siedzi na ławce. Ma duży kapelusz. Czyta książkę. Anna mówi: „Dzień dobry". Mężczyzna się uśmiecha. Daje Annie jabłko. Anna mówi: „Dziękuję".`,
      A2: `W zeszłą sobotę Anna poszła do parku. Pogoda była ciepła i słoneczna. Obok fontanny zobaczyła starszego mężczyznę w dużym czarnym kapeluszu. Siedział na ławce i czytał starą książkę. Anna podeszła i się przywitała. Mężczyzna uśmiechnął się i dał jej czerwone jabłko ze swojej kieszeni. „To magiczne jabłko" — powiedział cicho. Anna roześmiała się i podziękowała mu.`,
      B1: `Pewnej soboty Anna postanowiła pójść do parku, żeby trochę odpocząć. Dzień był ciepły, a w parku było mnóstwo ludzi. Obok starej fontanny zauważyła starszego mężczyznę w dużym czarnym kapeluszu. Siedział zupełnie sam i czytał książkę o pożółkłych stronach. Coś w nim wydało się Annie znajome, mimo że była pewna, że nigdy wcześniej go nie spotkała. Kiedy podeszła bliżej, mężczyzna podniósł wzrok i uśmiechnął się, jakby na nią czekał. W milczeniu wyciągnął z kieszeni czerwone jabłko i podał jej. „Weź — powiedział — przyda ci się". Anna nie wiedziała, co odpowiedzieć, i po prostu skinęła głową na znak wdzięczności.`,
      B2: `Pewnej soboty Anna, zmęczona po długim tygodniu pracy, wybrała się na spacer do miejskiego parku. Świeciło letnio łagodne słońce, w powietrzu pachniało świeżo skoszoną trawą i wydawało się, że nic nie zwiastuje niezwykłych zdarzeń. Jednak obok opuszczonej fontanny jej uwagę przykuł starszy mężczyzna w czarnym kapeluszu z szerokim rondem, który — jakby nie zauważając nikogo wokół — z uwagą czytał zniszczoną książkę. Coś w jego wyglądzie sprawiło, że Anna się zatrzymała. Podeszła bliżej i niepewnie się przywitała. Mężczyzna powoli podniósł wzrok, a w jego oczach mignął wyraz, którego Anna nie potrafiła rozszyfrować — czy to rozpoznanie, czy raczej lekki smutek. Nie mówiąc ani słowa, wyciągnął z kieszeni płaszcza czerwone jabłko i podał jej. „Wkrótce ci się przyda" — powiedział cicho, a te słowa z jakiegoś powodu sprawiły, że jej serce zabiło szybciej.`,
      C1: `Tamta sobota zaczynała się niczym nie wyróżniająco: po wyczerpującym tygodniu pracy Anna pragnęła jedynie odrobiny spokoju i skierowała się do starego parku położonego na obrzeżach miasta. Słońce świeciło łagodnie, jakby przez cienką woalkę, lekki wietrzyk ledwie muskał liście, a ogólny nastrój był ukojony, niemal usypiający. Jednak obok na wpół zarośniętej fontanny, w której od dawna nie pluskała się woda, Anna dostrzegła postać wybijającą się z tego pastoralnego obrazu. Starszy mężczyzna w czarnym kapeluszu z szerokim rondem, nasuniętym nisko na czoło, siedział samotnie na popękanej ławce i był całkowicie pochłonięty lekturą książki, której strony pożółkły od czasu. Coś nieuchwytnego w jego postawie przykuło jej uwagę i sprawiło, że została w miejscu, choć początkowo wcale nie zamierzała się zatrzymywać. Kiedy Anna, ulegając dziwnemu impulsowi, podeszła bliżej i się przywitała, starszy mężczyzna powoli, niemal niechętnie, podniósł na nią oczy. W jego spojrzeniu czytała się mieszanka niejasnego rozpoznania, lekkiej goryczy i jakiegoś nieuzasadnionego w tej chwili oczekiwania. Bez słowa wydobył z głębi płaszcza czerwone jabłko — zaskakująco świeże jak na tak wczesny ranek — i w milczeniu podał je Annie. „Weź — powiedział wreszcie głosem, w którym brzmiało zmęczenie całego życia — wkrótce ci się przyda". I jakby powiedziawszy wszystko, co miał do powiedzenia, ponownie pochylił się nad książką.`,
      C2: `Tamta sobota zaczynała się zwodniczo zwyczajnie: po wyczerpującym tygodniu pracy Anna skierowała się do starego parku na obrzeżach miasta w nadziei odzyskania kilku godzin tak upragnionego spokoju. Powietrze było przesycone tym nieuchwytnym aromatem wczesnej jesieni, w którym mieszają się przemoknięte liście, daleki dym i obietnica nadchodzących chłodów. Jednak przechodząc obok od dawna opuszczonej fontanny, której kamienne delfiny popękały od dziesięcioleci obojętności, Anna nagle się zatrzymała — nie z powodu jakiejś wyraźnej przyczyny, lecz ulegając owemu mglistemu przeczuciu, które niekiedy ogarnia nas u progu czegoś, czemu nie nadaliśmy jeszcze imienia. Na pochylonej ławce siedział starszy pan w czarnym kapeluszu, naciągniętym niemal po same brwi, pogrążony w lekturze foliantu, którego strony, pożółkłe od czasu, wydawały się — by tylko ich dotknąć — zaraz mieć rozsypać się w proch. Coś było w całej jego postaci — w sposobie, w jaki trzymał książkę, jakby była ona istotą żywą, w owej zastygłej, niemal ikonograficznej nieruchomości — co sprawiło, że Anna, osoba z natury skłonna raczej do delikatnego dystansu, podeszła bliżej i przerwała milczenie powściągliwym powitaniem. Mężczyzna nie odpowiedział od razu: najpierw jakby wyłonił się z głębi tekstu, a dopiero potem, powoli unosząc wzrok, zatrzymał go na niej z wyrazem, którego nie dało się rozłożyć na proste składowe — mieszanką rozpoznania, niepopartego najwyraźniej żadnymi rzeczywistymi podstawami, cichego smutku, tak głęboko zakorzenionego, że nie wydawał się już emocją, oraz spokojnego, niemal ceremonialnego oczekiwania. Nie wypowiadając ani słowa, wydobył spod poły płaszcza szkarłatne, absurdalnie świeże pośrodku tej zwiędłej jesieni jabłko i podał je Annie. „Weź — powiedział cicho, a jego głos brzmiał tak, jakby niósł w sobie ciężar wielu niewypowiedzianych lat — wkrótce ci się przyda". I jakby uznawszy swoją powinność za spełnioną, ponownie pochylił się nad otwartą książką, pozostawiając Annę w zakłopotaniu, ściskającą w dłoni nieoczekiwany dar.`
    }
  },
  audio: { A1:null, A2:null, B1:null, B2:null, C1:null, C2:null }
},
{
  id: 'demo-de-brief',
  title: 'Der Brief im Briefkasten',
  language: 'de',
  levels: {
    A1: `Es ist Montag. Lukas geht zum Briefkasten. Er sieht einen Brief. Der Brief ist alt. Auf dem Brief steht sein Name. Lukas öffnet den Brief. Im Brief ist ein Foto. Das Foto ist von seinem Großvater. Lukas ist überrascht. Er ruft seine Mutter. Seine Mutter lacht und sagt: „Das ist ein Geheimnis."`,

    A2: `Am Montagmorgen ging Lukas zum Briefkasten und fand dort einen alten gelben Brief. Auf dem Umschlag stand sein Name, aber es gab keinen Absender. Lukas war neugierig und öffnete den Brief sofort. Im Brief war ein altes Foto von seinem Großvater, der vor vielen Jahren gestorben war. Lukas konnte es kaum glauben. Er rannte ins Haus und zeigte das Foto seiner Mutter. Sie lächelte geheimnisvoll und sagte: „Eines Tages werde ich dir alles erzählen."`,

    B1: `An einem ganz normalen Montagmorgen machte sich Lukas wie immer auf den Weg zum Briefkasten. Er erwartete nichts Besonderes – höchstens ein paar Rechnungen oder Werbung. Doch zwischen den anderen Briefen lag ein gelber, vergilbter Umschlag, auf dem nur sein Name stand. Es gab weder einen Absender noch eine Briefmarke. Verwirrt öffnete Lukas den Brief und fand darin ein altes Schwarz-Weiß-Foto von seinem Großvater, der schon lange nicht mehr lebte. Auf der Rückseite stand in unleserlicher Schrift: „Vergiss nicht, wer du bist." Lukas spürte, wie ihm ein kalter Schauer über den Rücken lief. Er rannte zu seiner Mutter, die das Foto lange schweigend ansah, bevor sie endlich sagte, sie müsse mit ihm reden.`,

    B2: `An einem unscheinbaren Montagmorgen, an dem nichts darauf hindeutete, dass dieser Tag anders verlaufen würde als jeder andere, ging Lukas wie gewöhnlich hinunter zum Briefkasten. Zwischen den üblichen Werbeprospekten und längst überfälligen Rechnungen entdeckte er jedoch einen vergilbten, etwas knittrigen Umschlag, auf dem in altmodischer Handschrift ausschließlich sein Name geschrieben stand – ohne Absender, ohne Briefmarke, ohne irgendeinen Hinweis darauf, wie er hier hingelangt war. Mit einer Mischung aus Neugier und unbestimmtem Unbehagen riss Lukas den Umschlag auf und fand darin ein altes Schwarz-Weiß-Foto seines Großvaters, der bereits vor über zehn Jahren gestorben war. Auf der Rückseite stand in einer fast unleserlichen Schrift der seltsame Satz: „Vergiss nie, wer du wirklich bist." Lukas spürte, wie sich ihm der Magen zusammenzog. Er rannte ins Haus und legte seiner Mutter das Foto wortlos auf den Küchentisch. Sie betrachtete es eine ganze Weile, ohne etwas zu sagen, und schließlich, mit einer Stimme, die plötzlich viel älter klang als ihre Jahre, meinte sie nur: „Setz dich hin, Lukas. Wir müssen reden."`,

    C1: `Es war einer jener verhangenen Montagmorgen, an denen alles seinen gewohnten Gang zu nehmen schien und jede Abweichung vom Alltäglichen geradezu unwahrscheinlich wirkte, als Lukas, immer noch halb verschlafen, hinunterging, um den Briefkasten zu leeren. Er rechnete bestenfalls mit den üblichen Rechnungen und allerlei nichtssagender Werbung; was er allerdings nicht erwartet hatte, war ein vergilbter, leicht angeschmuddelter Umschlag, auf dem in einer eigentümlich altmodischen Handschrift lediglich sein Name geschrieben stand – kein Absender, keine Briefmarke, keinerlei Hinweis darauf, wie dieses Schriftstück seinen Weg in den Kasten gefunden haben konnte. Eine seltsame Mischung aus Neugier und unbehaglicher Vorahnung trieb ihn dazu, den Brief noch im Hausflur zu öffnen. Im Inneren befand sich nichts weiter als ein vergilbtes Schwarz-Weiß-Foto seines Großvaters, der bereits vor mehr als einem Jahrzehnt verstorben war, und auf dessen Rückseite, in einer beinahe unleserlichen, zittrigen Schrift, der knappe und doch unheimlich nachhallende Satz prangte: „Vergiss nie, wer du in Wahrheit bist." Lukas spürte, wie ihm das Blut in den Schläfen pochte. Ohne ein Wort eilte er hinauf in die Küche, legte das Foto vor seine Mutter, und sie, die sonst nie um eine schnelle Antwort verlegen war, betrachtete es lange, mit einem Ausdruck, in dem sich Schuldbewusstsein und etwas wie Erleichterung mischten. Schließlich seufzte sie tief und sagte mit einer Stimme, die ihm fremd vorkam: „Es ist wohl an der Zeit, dass du die Wahrheit erfährst."`,

    C2: `Es war einer jener trüben, vom Nieselregen leicht durchzogenen Montagmorgen, an denen die Welt sich in stillschweigender Übereinkunft mit dem Alltäglichen zu befinden scheint und schon der Gedanke an irgendeine bemerkenswerte Begebenheit beinahe absurd anmutet, als Lukas, noch nicht ganz dem Halbdunkel seines Schlafzimmers entkommen, mit der ihm eigenen, halb mechanischen Bewegung hinunterging, um den Briefkasten zu leeren. Was er erwartete, war nichts weiter als das übliche Sammelsurium aus Mahnungen, Steuerbescheiden und jenen aufdringlich bunten Werbeprospekten, an denen sich die Tristesse des modernen Wohnens so unermüdlich abarbeitet. Was er stattdessen vorfand, war ein einzelner, vergilbter und an den Rändern bereits leicht ausgefranster Umschlag, dessen Anblick ihn, ohne dass er sich darüber sogleich Rechenschaft ablegen konnte, mit einer eigentümlichen Mischung aus diffuser Vorahnung und kaum eingestandener Beklommenheit erfüllte. Auf der Vorderseite prangte in einer fein geschwungenen, geradezu kalligraphisch anmutenden Handschrift lediglich sein eigener Name – kein Absender, keine Briefmarke, kein Stempel, kein Indiz, das Aufschluss darüber hätte geben können, wie dieses Schriftstück seinen Weg in den Briefkasten eines unauffälligen Vorortreihenhauses gefunden haben sollte. Mit jenen tastenden Bewegungen, mit denen man Dinge berührt, von denen man insgeheim ahnt, dass sie das eigene Leben nicht unverändert lassen werden, öffnete Lukas das Kuvert noch im halbdunklen Hausflur und entdeckte darin nichts als ein einziges, in Sepia getauchtes Foto seines Großvaters – jenes Großvaters, der bereits vor mehr als einem Jahrzehnt mit bemerkenswerter Diskretion aus dieser Welt geschieden war. Auf der Rückseite jedoch, kaum noch leserlich, weil die Tinte vom Papier in den Lauf der Jahre zurückzukehren schien, stand in derselben kalligraphischen Schrift wie auf dem Umschlag der knappe, beinahe orakelhafte Satz: „Vergiss niemals, wer du in Wahrheit bist." Lukas verharrte einen Augenblick lang regungslos, und das Gefühl, das ihn überkam, war weniger Erschrecken im engeren Sinne als jenes seltsame, einer plötzlichen Wiedererkennung verwandte Frösteln, das uns überfällt, wenn wir spüren, dass eine Wahrheit, die wir bislang lediglich erahnt hatten, im Begriff steht, ihre stille Verborgenheit zu verlassen. Er stieg die Treppe hinauf, betrat die Küche, in der seine Mutter beim Frühstück saß, und legte das Foto wortlos vor sie hin. Sie hob den Blick, betrachtete das Bild eine Weile mit jenem ausdruckslosen, zugleich aber undurchdringlichen Gesicht, das er an ihr nur dann zu sehen bekam, wenn ein Thema sie tiefer berührte, als sie zugeben wollte, und schließlich, nach einem Schweigen, das ihm beinahe unerträglich vorkam, sagte sie mit einer Stimme, die plötzlich um Jahrzehnte gealtert schien: „Setz dich, Lukas. Es wird Zeit, dass du erfährst, was wir dir niemals erzählen wollten."`
  },
  questions: {
    tprs: [
      { q: "Was findet Lukas im Briefkasten?", a: "Einen alten Brief." },
      { q: "Steht ein Absender auf dem Brief?", a: "Nein." },
      { q: "Wer ist auf dem Foto?", a: "Sein Großvater." },
      { q: "Lebt der Großvater noch?", a: "Nein, er ist gestorben." },
      { q: "Wem zeigt Lukas das Foto?", a: "Seiner Mutter." },
      { q: "Wie reagiert die Mutter auf das Foto?", a: "Sie wird ernst und will reden." },
      { q: "Hast du schon einmal etwas Geheimnisvolles bekommen?", a: "" }
    ],
    comprehension: [
      { type:'mc', q: "Wo findet Lukas den Brief?",
        options:["Auf dem Tisch","Im Briefkasten","Im Garten","In der Schule"], correct: 1 },
      { type:'tf', q: "Auf dem Brief steht ein Absender.", correct: false },
      { type:'mc', q: "Wer ist auf dem Foto?",
        options:["Sein Vater","Seine Mutter","Sein Großvater","Sein Bruder"], correct: 2 },
      { type:'open', q: "Was glaubst du, welches Geheimnis die Mutter Lukas erzählen will?" }
    ]
  },
  translations: {
    pl: {
      A1: `Jest poniedziałek. Łukasz idzie do skrzynki pocztowej. Widzi list. List jest stary. Na liście jest jego imię. Łukasz otwiera list. W liście jest zdjęcie. To zdjęcie jego dziadka. Łukasz jest zaskoczony. Woła mamę. Mama śmieje się i mówi: „To jest tajemnica".`,
      A2: `W poniedziałkowy poranek Łukasz poszedł do skrzynki pocztowej i znalazł tam starą żółtą kopertę. Na kopercie było jego imię, ale nie było nadawcy. Łukasz był ciekawy i od razu otworzył list. W liście było stare zdjęcie jego dziadka, który zmarł wiele lat temu. Łukasz nie mógł w to uwierzyć. Pobiegł do domu i pokazał zdjęcie mamie. Uśmiechnęła się tajemniczo i powiedziała: „Pewnego dnia wszystko ci opowiem".`,
      B1: `W jeden całkiem zwyczajny poniedziałkowy poranek Łukasz, jak zawsze, ruszył w stronę skrzynki pocztowej. Nie spodziewał się niczego szczególnego — co najwyżej kilku rachunków albo reklam. Jednak między innymi listami leżała żółta, pożółkła koperta, na której znajdowało się tylko jego imię. Nie było ani nadawcy, ani znaczka. Zaskoczony Łukasz otworzył list i znalazł w nim stare czarno-białe zdjęcie swojego dziadka, który już od dawna nie żył. Na odwrocie zdjęcia, ledwo czytelnym pismem, napisano: „Nie zapomnij, kim jesteś". Łukasz poczuł, jak po plecach przechodzi mu zimny dreszcz. Pobiegł do mamy, która długo i w milczeniu przyglądała się zdjęciu, zanim wreszcie powiedziała, że musi z nim porozmawiać.`,
      B2: `Pewnego niczym niewyróżniającego się poniedziałkowego poranka, w którym nic nie zapowiadało, że ten dzień będzie się różnił od jakiegokolwiek innego, Łukasz, jak zwykle, zszedł do skrzynki pocztowej. Wśród zwykłych ulotek reklamowych i dawno zaległych rachunków zauważył jednak pożółkłą, lekko pogniecioną kopertę, na której staromodnym pismem widniało wyłącznie jego imię — bez nadawcy, bez znaczka, bez jakiejkolwiek wskazówki, jak ów list trafił do skrzynki. Z mieszaniną ciekawości i nieokreślonego niepokoju Łukasz rozdarł kopertę i znalazł w niej stare czarno-białe zdjęcie swojego dziadka, który zmarł już ponad dziesięć lat temu. Na odwrocie, niemal nieczytelnym pismem, widniało dziwne zdanie: „Nigdy nie zapomnij, kim naprawdę jesteś". Łukasz poczuł, jak ściska mu się żołądek. Pobiegł do domu i bez słowa położył zdjęcie mamie na kuchennym stole. Patrzyła na nie przez dłuższą chwilę, nic nie mówiąc, aż w końcu, głosem, który nagle zabrzmiał znacznie starzej niż jej lata, powiedziała tylko: „Usiądź, Łukaszu. Musimy porozmawiać".`,
      C1: `Był to jeden z tych pochmurnych poniedziałkowych poranków, w których wszystko zdaje się toczyć utartym torem, a jakiekolwiek odstępstwo od codzienności wydaje się wręcz nieprawdopodobne, gdy Łukasz, wciąż na wpół zaspany, zszedł na dół, by opróżnić skrzynkę pocztową. Spodziewał się w najlepszym wypadku zwykłych rachunków i bezbarwnej reklamy; czego jednak nie oczekiwał, to pożółkłej, lekko zabrudzonej koperty, na której osobliwie staromodnym charakterem pisma widniało jedynie jego imię — bez nadawcy, bez znaczka, bez żadnej wskazówki, w jaki sposób owe pismo trafiło do skrzynki. Dziwna mieszanka ciekawości i niepokojącego przeczucia skłoniła go do otwarcia listu jeszcze w sieni. Wewnątrz znajdowało się tylko pożółkłe czarno-białe zdjęcie jego dziadka, który zmarł ponad dziesięć lat temu, a na jego odwrocie, niemal nieczytelnym, drżącym pismem, widniało krótkie, a zarazem niepokojąco wibrujące zdanie: „Nigdy nie zapomnij, kim naprawdę jesteś". Łukasz poczuł, jak krew pulsuje mu w skroniach. Bez słowa pobiegł do kuchni, położył zdjęcie przed matką, a ona, która zwykle nie miała problemu z szybką odpowiedzią, długo mu się przyglądała, z wyrazem, w którym mieszało się poczucie winy i coś jakby ulga. Wreszcie westchnęła głęboko i powiedziała głosem, który wydał mu się obcy: „Chyba nadszedł czas, abyś poznał prawdę".`,
      C2: `Był to jeden z tych ponurych, lekko przesłoniętych mżawką poniedziałkowych poranków, w których świat zdaje się tkwić w cichym porozumieniu z codziennością, a sama myśl o jakimkolwiek godnym uwagi zdarzeniu wydaje się niemal absurdalna, gdy Łukasz, jeszcze nie do końca wyrwany z półmroku swojej sypialni, ze swoim charakterystycznym, na poły mechanicznym ruchem zszedł na dół, aby opróżnić skrzynkę pocztową. Spodziewał się jedynie zwykłego zestawu upomnień, decyzji podatkowych i tych natrętnie kolorowych ulotek reklamowych, na których tak nieustępliwie pasożytuje smutek współczesnego mieszkalnictwa. Tym, co znalazł, była natomiast pojedyncza, pożółkła, na brzegach już lekko poszarpana koperta, której widok napełnił go — choć nie potrafił sobie tego od razu wyjaśnić — osobliwą mieszanką nieokreślonego przeczucia i ledwo przyznawanego niepokoju. Na awersie, w pięknie wijącym się, niemal kaligraficznym piśmie, którego sama staromodność już zasługiwała na uwagę, widniało jedynie jego własne imię — bez nadawcy, bez znaczka, bez stempla, bez jakiejkolwiek wskazówki, która mogłaby wyjaśnić, w jaki sposób ów list trafił do skrzynki niepozornego szeregowca na peryferiach. Z tymi niepewnymi, wymacującymi ruchami, którymi dotyka się rzeczy, co do których w głębi serca przeczuwa się, że nie pozostawią nas takimi, jakimi byliśmy, Łukasz otworzył kopertę jeszcze w półmrocznej sieni i odkrył w niej jedynie jedno, utopione w sepii zdjęcie swojego dziadka — owego dziadka, który już ponad dziesięć lat temu z godną podziwu dyskrecją i w niewypowiedzianym porozumieniu ze śmiercią opuścił ten świat. Jednak na odwrocie, ledwie czytelnie, ponieważ atrament zdawał się powracać z papieru w głąb lat, widniało tym samym kaligraficznym pismem co na kopercie krótkie, niemal wyroczne zdanie: „Nigdy nie zapominaj, kim naprawdę jesteś". Łukasz zastygł na chwilę w bezruchu, a uczucie, jakie go ogarnęło, nie było tyle przerażeniem w ścisłym sensie, ile owym dziwnym, pokrewnym nagłemu rozpoznaniu drżeniem, które niekiedy nas dopada, gdy czujemy, że prawda, której dotąd jedynie się domyślaliśmy, zaczyna opuszczać swoje milczące ukrycie. Wszedł na górę po schodach, wszedł do kuchni, w której matka siadała właśnie do śniadania, i bez słowa położył przed nią zdjęcie. Podniosła wzrok, przyglądała się obrazowi przez dłuższą chwilę z owym bezwyrazowym, a zarazem nieprzeniknionym wyrazem twarzy, który widywał u niej tylko wówczas, gdy jakiś temat dotykał ją głębiej, niż chciała przyznać, i wreszcie po milczeniu, które wydało mu się niemal nie do zniesienia, powiedziała głosem, który nagle wydawał się postarzały o dziesiątki lat: „Usiądź, Łukaszu. Nadszedł czas, abyś dowiedział się tego, czego nigdy nie chcieliśmy ci powiedzieć".`
    }
  },
  audio: { A1:null, A2:null, B1:null, B2:null, C1:null, C2:null }
},
{
  id: 'demo-fr-librairie',
  title: 'La vieille librairie',
  language: 'fr',
  levels: {
    A1: `C'est dimanche. Élise marche dans la rue. Il fait beau. Elle voit une vieille librairie. La porte est ouverte. Élise entre. Dans la librairie, il y a beaucoup de livres. Un vieil homme sourit. Il donne un petit livre à Élise. Le livre est rouge. Élise dit : « Merci ». Elle est très contente.`,

    A2: `Dimanche dernier, Élise se promenait dans une petite rue qu'elle ne connaissait pas. Le soleil brillait et elle avait envie de découvrir le quartier. Tout à coup, elle a vu une vieille librairie avec une porte en bois. Elle est entrée par curiosité. À l'intérieur, il y avait des centaines de livres. Un vieil homme avec des lunettes rondes lui a souri. Sans rien dire, il a pris un petit livre rouge et le lui a offert. « Pour vous, mademoiselle », a-t-il dit doucement. Élise a remercié l'homme et elle est sortie, le cœur léger.`,

    B1: `Ce dimanche-là, Élise se promenait sans but précis dans une partie de la ville où elle n'était jamais allée. Le temps était doux, le ciel d'un bleu éclatant, et elle ressentait ce léger plaisir que procurent les promenades sans destination. En tournant au coin d'une petite rue pavée, elle remarqua une vieille librairie dont la façade semblait n'avoir pas changé depuis un siècle. La porte en bois était entrouverte, comme si elle l'invitait à entrer. À l'intérieur, l'odeur de papier ancien la frappa aussitôt. Des centaines, peut-être des milliers de livres, s'empilaient du sol au plafond. Derrière le comptoir se tenait un vieil homme aux lunettes rondes qui leva les yeux et sourit, comme s'il l'attendait depuis longtemps. Sans dire un mot, il prit un petit livre rouge sur une étagère et le tendit à Élise. « Celui-ci vous est destiné », murmura-t-il avec un calme étrange. Élise n'osa pas refuser. Elle remercia et sortit, sans pouvoir s'empêcher de penser que quelque chose d'inhabituel venait de se produire.`,

    B2: `Ce dimanche d'octobre s'annonçait sans relief particulier : Élise, lasse de sa semaine, avait simplement décidé de se laisser porter par ses pas dans un quartier qu'elle n'avait jamais véritablement exploré. Le soleil, déjà bas malgré l'heure, baignait les façades d'une lumière dorée qui adoucissait jusqu'aux moindres aspérités de la pierre. C'est en s'engageant dans une ruelle pavée et étonnamment silencieuse qu'elle aperçut, presque dissimulée entre deux immeubles, une vieille librairie dont la devanture en bois sombre semblait avoir résisté à la modernité par pure obstination. La porte, légèrement entrouverte, dégageait cette odeur si particulière de papier jauni et de poussière qui, pour certains, équivaut à un appel irrésistible. Sans tout à fait comprendre pourquoi, Élise franchit le seuil. À l'intérieur régnait un silence presque solennel. Des étagères chargées de livres montaient jusqu'au plafond, et derrière un comptoir patiné par les années se tenait un vieil homme aux lunettes rondes, qui leva lentement la tête à son entrée. Son regard, calme et étrangement bienveillant, donnait l'impression qu'il l'attendait depuis longtemps. Sans prononcer un mot, il s'approcha d'une étagère, en retira un petit livre relié de cuir rouge et le lui tendit. « Celui-ci, dit-il enfin, n'a fait que vous attendre. » Élise, troublée, n'osa ni accepter immédiatement ni refuser. Lorsqu'elle ressortit dans la rue, le livre serré contre elle, elle ne put se défaire du sentiment que cette rencontre n'avait rien eu de fortuit.`,

    C1: `Ce dimanche d'octobre, Élise s'était engagée dans la promenade avec cette nonchalance vaguement mélancolique qui s'empare parfois des âmes urbaines au lendemain d'une semaine particulièrement éprouvante. Le ciel, d'un bleu un peu pâli, laissait filtrer une lumière oblique qui transformait les façades en autant de tableaux suspendus, et la ville elle-même paraissait avoir consenti, pour quelques heures, à se montrer sous un jour moins indifférent. C'est ainsi, presque par inadvertance, qu'elle s'engagea dans une ruelle pavée qu'elle aurait juré n'avoir jamais empruntée auparavant, bien que celle-ci se trouvât à quelques pas seulement de son trajet quotidien. Là, blottie entre deux immeubles à l'austérité haussmannienne, une vieille librairie aux boiseries patinées par les décennies semblait défier les exigences contemporaines de la rentabilité. La porte, légèrement entrebâillée, exhalait cette odeur immédiatement reconnaissable de papier jauni et de cuir vieilli qui, pour quiconque a un jour aimé un livre, agit comme une promesse. Cédant à une impulsion qu'elle eût été bien en peine d'expliquer, Élise franchit le seuil et fut aussitôt enveloppée par un silence d'une qualité particulière, plus évocateur encore que la pénombre qui régnait à l'intérieur. Des étagères vertigineuses, chargées de volumes aux dorures effacées, montaient jusqu'à un plafond mouluré, et derrière un comptoir d'acajou se tenait un vieil homme aux lunettes rondes, dont le regard, lorsqu'il se posa sur elle, n'exprima ni la surprise du libraire occasionnel ni l'indifférence du marchand blasé, mais quelque chose d'infiniment plus troublant : la satisfaction discrète de celui qui voit enfin se présenter une visiteuse longuement attendue. Sans dire un mot, il se leva, s'approcha d'une étagère, et en retira un petit volume relié de cuir rouge dont le titre, à demi effacé, demeurait illisible. « Voici, mademoiselle, finit-il par dire d'une voix douce mais étrangement assurée, le livre qui n'aura jamais cessé de vous attendre. » Élise prit l'ouvrage en silence, et, sortant peu après dans la lumière déclinante de la rue, ne put s'empêcher de songer que sa promenade venait de basculer, sans qu'elle l'eût décidé, en quelque chose qui ressemblait fort à un commencement.`,

    C2: `Ce dimanche-là, par l'un de ces concours de circonstances en apparence anodins dont la mémoire, plus tard, viendra extraire la signification, Élise s'était laissé porter par une promenade dépourvue d'intention véritable, ce genre de déambulation un peu rêveuse à laquelle on s'abandonne au sortir d'une semaine où la fatigue, sans être dramatique, finit par rendre l'âme poreuse aux suggestions du hasard. Le ciel d'octobre, d'un bleu pâli par l'automne, dispensait une lumière oblique et presque cérémonieuse, transformant chaque façade en une toile dont les détails ordinaires – une corniche, un volet entrouvert, l'ombre d'une jardinière – acquéraient, sous cet éclairage, la dignité de motifs longuement médités. C'est ainsi, par une distraction qui devait avoir bien davantage à voir avec la nécessité qu'avec le simple égarement, qu'elle s'engagea dans une ruelle pavée dont elle aurait juré, malgré la proximité immédiate de ses itinéraires habituels, n'avoir jamais soupçonné l'existence. Là, dans un retrait qui semblait avoir résisté à la rénovation par une obstination toute philosophique, se dressait une vieille librairie dont la devanture en bois sombre, écaillée par d'innombrables hivers, paraissait moins le vestige d'une époque révolue qu'un avertissement délicat à l'adresse des passants : ici, le temps n'a pas tout à fait consenti aux mêmes compromis qu'ailleurs. La porte, entrebâillée juste assez pour laisser deviner sans révéler, exhalait cette odeur immédiatement reconnaissable où se mêlent papier jauni, cuir vieilli et ce parfum plus subtil encore d'attente patiente qui caractérise les lieux longtemps fréquentés par les livres. Cédant à une impulsion qu'elle ne tenta même pas de justifier, Élise franchit le seuil et fut accueillie par un silence d'une densité presque liquide, ponctué seulement par le froissement, à peine perceptible, de pages que personne en apparence ne tournait. Des étagères monumentales, ployant sous le poids accumulé d'une bibliophilie patiente, s'élevaient jusqu'à un plafond aux moulures noircies par la patine, et derrière un comptoir d'acajou se tenait un vieil homme aux lunettes rondes. Lorsqu'il leva les yeux à son entrée, son regard, dépourvu de la moindre surprise, ne trahit ni l'attention machinale du commerçant ni la curiosité du collectionneur, mais une qualité d'accueil bien plus inquiétante : celle, infiniment courtoise et néanmoins implacable, de qui sait depuis longtemps qu'une certaine personne devait franchir ce seuil ce jour précis et nul autre. Sans prononcer une parole, il se leva avec la lenteur cérémonielle de ceux qui ont depuis longtemps renoncé à toute hâte, gagna une étagère que rien ne paraissait distinguer des autres, et en retira un petit volume relié de cuir rouge dont le titre, à demi effacé, semblait moins absent qu'intentionnellement réservé. « Voici, mademoiselle, finit-il par dire d'une voix douce mais empreinte d'une assurance singulière, le livre qui, depuis fort longtemps déjà, n'attendait plus que vous. » Élise reçut l'ouvrage en silence, comme on accepte une responsabilité que l'on n'a pas demandée mais dont on devine qu'il serait vain de la décliner. Et, lorsque, quelques instants plus tard, elle se retrouva dans la lumière déclinante de la ruelle, le volume serré contre elle, elle ne put s'empêcher d'éprouver le sentiment, à la fois bouleversant et étrangement rassurant, que sa promenade dominicale n'avait pas tant pris fin qu'elle ne venait, à proprement parler, de commencer.`
  },
  questions: {
    tprs: [
      { q: "Que fait Élise dimanche ?", a: "Elle se promène." },
      { q: "Que voit-elle dans la petite rue ?", a: "Une vieille librairie." },
      { q: "La porte est-elle ouverte ou fermée ?", a: "Ouverte." },
      { q: "Qui est dans la librairie ?", a: "Un vieil homme." },
      { q: "Que donne le vieil homme à Élise ?", a: "Un petit livre rouge." },
      { q: "Élise paie-t-elle le livre ?", a: "Non, c'est un cadeau." },
      { q: "Et toi, aimes-tu les vieilles librairies ?", a: "" }
    ],
    comprehension: [
      { type:'mc', q: "Où va Élise ?",
        options:["Au cinéma","Dans une librairie","Au restaurant","Chez elle"], correct: 1 },
      { type:'tf', q: "Le vieil homme vend le livre à Élise.", correct: false },
      { type:'mc', q: "De quelle couleur est le livre ?",
        options:["Bleu","Vert","Rouge","Noir"], correct: 2 },
      { type:'open', q: "À ton avis, pourquoi le vieil homme dit-il que le livre attendait Élise ?" }
    ]
  },
  translations: {
    pl: {
      A1: `Jest niedziela. Elise idzie ulicą. Jest ładnie. Widzi starą księgarnię. Drzwi są otwarte. Elise wchodzi. W księgarni jest dużo książek. Starszy mężczyzna się uśmiecha. Daje Elise małą książkę. Książka jest czerwona. Elise mówi: „Dziękuję". Jest bardzo szczęśliwa.`,
      A2: `W zeszłą niedzielę Elise spacerowała po małej uliczce, której nie znała. Świeciło słońce, a ona miała ochotę odkryć tę dzielnicę. Nagle zobaczyła starą księgarnię z drewnianymi drzwiami. Weszła z ciekawości. W środku były setki książek. Starszy mężczyzna w okrągłych okularach uśmiechnął się do niej. Nic nie mówiąc, wziął małą czerwoną książkę i ofiarował jej ją. „To dla pani, panienko" — powiedział łagodnie. Elise podziękowała mężczyźnie i wyszła z lekkim sercem.`,
      B1: `Tej niedzieli Elise spacerowała bez konkretnego celu po części miasta, w której nigdy wcześniej nie była. Było ciepło, niebo miało wyrazisty błękit, a ona odczuwała tę lekką przyjemność, jaką dają spacery bez celu. Skręcając w róg małej brukowanej uliczki, zauważyła starą księgarnię, której fasada wyglądała tak, jakby nie zmieniła się od stulecia. Drewniane drzwi były uchylone, jakby zapraszały ją do środka. W środku natychmiast uderzył ją zapach starego papieru. Setki, a może i tysiące książek, piętrzyły się od podłogi do sufitu. Za ladą stał starszy mężczyzna w okrągłych okularach, który podniósł oczy i uśmiechnął się, jakby czekał na nią od dawna. Bez słowa zdjął z półki małą czerwoną książkę i podał ją Elise. „Ta jest dla pani" — wyszeptał z dziwnym spokojem. Elise nie odważyła się odmówić. Podziękowała i wyszła, nie mogąc oprzeć się myśli, że właśnie wydarzyło się coś niezwykłego.`,
      B2: `Ta październikowa niedziela zapowiadała się bez większych wrażeń: Elise, zmęczona całym tygodniem, postanowiła po prostu pozwolić, by jej stopy poniosły ją po dzielnicy, której nigdy tak naprawdę nie zwiedzała. Słońce, choć było już nisko mimo wczesnej pory, oblewało fasady złotym światłem, które łagodziło nawet najdrobniejsze chropowatości kamienia. Wchodząc w brukowaną i zaskakująco cichą uliczkę, dostrzegła — niemal ukrytą między dwiema kamienicami — starą księgarnię, której ciemna drewniana witryna zdawała się stawiać czoła nowoczesności wyłącznie z uporu. Drzwi, lekko uchylone, wydzielały ów szczególny zapach pożółkłego papieru i kurzu, który dla niektórych równa się nieodpartemu wezwaniu. Nie do końca wiedząc dlaczego, Elise przekroczyła próg. W środku panowała niemal uroczysta cisza. Półki uginające się pod ciężarem książek sięgały sufitu, a za pokrytą patyną lat ladą stał starszy mężczyzna w okrągłych okularach, który wolno podniósł głowę na jej wejście. Jego spokojne i dziwnie życzliwe spojrzenie sprawiało wrażenie, jakby czekał na nią od dawna. Bez słowa podszedł do półki, zdjął z niej małą książkę oprawną w czerwoną skórę i podał ją. „Ta — powiedział wreszcie — tylko na panią czekała". Elise, poruszona, nie zdecydowała się ani natychmiast jej przyjąć, ani odmówić. Kiedy wyszła z powrotem na ulicę, ściskając książkę do siebie, nie mogła oprzeć się wrażeniu, że to spotkanie nie miało w sobie nic przypadkowego.`,
      C1: `Tej październikowej niedzieli Elise wybrała się na spacer z owym niefrasobliwym, lekko melancholijnym usposobieniem, które niekiedy ogarnia miejskie dusze po szczególnie wyczerpującym tygodniu. Niebo, w bladawym błękicie, przepuszczało ukośne światło, które zamieniało fasady w obrazy zawieszone w przestrzeni, a samo miasto wydawało się — przez kilka godzin — zgodzić się na pokazanie się od mniej obojętnej strony. To właśnie tak, niemal przez nieuwagę, weszła w brukowaną uliczkę, której — mogłaby przysiąc — nigdy wcześniej nie przemierzała, mimo że znajdowała się ona zaledwie kilka kroków od jej codziennej trasy. Tam, wciśnięta między dwie kamienice o haussmannowskiej powściągliwości, stała stara księgarnia, której pokryte patyną dekad drewniane wykończenia zdawały się ignorować współczesne wymogi rentowności. Drzwi, lekko uchylone, wydzielały ów natychmiast rozpoznawalny zapach pożółkłego papieru i starej skóry, który dla każdego, kto kiedykolwiek pokochał książkę, działa niczym obietnica. Ulegając impulsowi, którego sama nie potrafiłaby wyjaśnić, Elise przekroczyła próg i natychmiast spowiło ją milczenie szczególnego rodzaju, jeszcze bardziej sugestywne niż półmrok panujący w środku. Zawrotnie wysokie półki, wypełnione tomami o wytartych złoceniach, sięgały aż do gzymsowanego sufitu, a za ladą z mahoniu stał starszy mężczyzna w okrągłych okularach, którego wzrok, gdy spoczął na niej, nie wyrażał ani zaskoczenia okazjonalnego księgarza, ani obojętności znudzonego kupca, ale coś nieskończenie bardziej niepokojącego: dyskretne zadowolenie kogoś, kto widzi wreszcie pojawiającą się długo wyczekiwaną gościnię. Bez słowa wstał, podszedł do półki, której nic nie wyróżniało od innych, i zdjął z niej mały tomik oprawny w czerwoną skórę, którego tytuł, na wpół zatarty, pozostawał nieczytelny. „Oto, panienko — powiedział wreszcie głosem łagodnym, lecz dziwnie pewnym — książka, która nigdy nie przestała na panią czekać". Elise wzięła tomik w milczeniu i, wychodząc chwilę później na zachodzące światło uliczki, nie mogła oprzeć się myśli, że jej spacer właśnie się zmienił — bez jej decyzji — w coś, co bardzo przypominało początek.`,
      C2: `Tej niedzieli, na skutek jednego z tych pozornie błahych zbiegów okoliczności, z których pamięć dopiero później wydobywa znaczenie, Elise pozwoliła się ponieść spacerowi pozbawionemu prawdziwego zamiaru — tego rodzaju zamyślonej, nieco rozmarzonej wędrówce, której oddajemy się, wychodząc z tygodnia, w którym zmęczenie, choć nie dramatyczne, w końcu sprawia, że dusza staje się podatna na sugestie przypadku. Październikowe niebo, w błękicie pobladłym przez jesień, rozdzielało ukośne, niemal ceremonialne światło, zamieniając każdą fasadę w płótno, którego zwyczajne detale — gzyms, uchylona okiennica, cień skrzyni okiennej — pod tym oświetleniem nabierały godności długo przemyślanych motywów. To właśnie tak, przez roztargnienie, które miało zdecydowanie więcej wspólnego z koniecznością niż ze zwykłym zbłądzeniem, weszła w brukowaną uliczkę, której — mogłaby przysiąc, mimo bliskości jej codziennych tras — nigdy nie podejrzewała istnienia. Tam, w zakątku, który zdawał się oprzeć renowacji z czysto filozoficznego uporu, wznosiła się stara księgarnia, której ciemna drewniana witryna, łuszcząca się od niezliczonych zim, wyglądała mniej na pozostałość minionej epoki, a bardziej na delikatne ostrzeżenie skierowane do przechodniów: tutaj czas nie do końca zgodził się na te same kompromisy, co gdzie indziej. Drzwi, uchylone akurat na tyle, by pozwolić przeczuwać, nie odsłaniając, wydzielały ów natychmiast rozpoznawalny zapach, w którym mieszają się pożółkły papier, stara skóra i jeszcze bardziej subtelny zapach cierpliwego oczekiwania, który charakteryzuje miejsca długo zamieszkałe przez książki. Ulegając impulsowi, którego nawet nie próbowała usprawiedliwiać, Elise przekroczyła próg i została powitana milczeniem o niemal płynnej gęstości, przerywanym jedynie ledwie słyszalnym szelestem stron, których nikt — z pozoru — nie odwracał. Monumentalne półki, uginające się pod nagromadzonym ciężarem cierpliwej bibliofilii, wznosiły się aż do gzymsowanego sufitu o sczerniałych od patyny dekoracjach, a za mahoniową ladą, której powierzchnia, polerowana przez pokolenia zamyślonych dłoni, zachowała tłumiony blask rzeczy często głaskanej, stał starszy mężczyzna w okrągłych okularach. Kiedy podniósł wzrok na jej wejście, jego spojrzenie, pozbawione cienia zaskoczenia, nie zdradzało ani machinalnej uwagi sprzedawcy, ani ciekawości kolekcjonera, ale bez porównania bardziej niepokojącą jakość przyjęcia: tę nieskończenie uprzejmą i jednocześnie nieubłaganą, właściwą komuś, kto wie od dawna i z dokładnością, której nic nie wyjaśnia, że pewna osoba miała przekroczyć ten próg właśnie tego dnia i żadnego innego. Nie wypowiadając ani słowa, wstał z tą ceremonialną powolnością, jaką cechują się ci, którzy już dawno wyrzekli się wszelkiego pośpiechu, doszedł do półki, której nic nie zdawało się odróżniać od innych, i zdjął z niej mały tomik oprawny w czerwoną skórę, którego tytuł, na wpół zatarty przez ocieranie się czasu, wydawał się raczej celowo zarezerwowanym niż nieobecnym. „Oto, panienko — powiedział wreszcie, a jego głos miał ową szczególną łagodność tych, którzy ważą każde słowo nie ze strachu, lecz z szacunku dla poprzedzającego je milczenia — książka, która od bardzo dawna już czeka tylko na panią". Elise przyjęła tomik w milczeniu, tak jak przyjmuje się odpowiedzialność, o którą się nie prosiło, ale o której domyśla się, że odmówienie byłoby próżne, a może nawet niedelikatne. A kiedy chwilę później znalazła się w zachodzącym świetle uliczki, ściskając tomik do siebie z tą nieporadną troskliwością, którą rezerwujemy dla przedmiotów jeszcze niezrozumianych, nie mogła oprzeć się wrażeniu — jednocześnie wstrząsającemu i dziwnie kojącemu — że jej niedzielny spacer nie tyle dobiegł końca, ile dopiero właśnie się rozpoczął.`
    }
  },
  audio: { A1:null, A2:null, B1:null, B2:null, C1:null, C2:null }
},
{
  id: 'demo-en-smartphone',
  title: 'The smartphone trap',
  language: 'en',
  levels: {
    A1: `A smartphone is small. Many children have a smartphone. Parents are happy. The child is quiet. The child does not cry. But this is not good. The child is on the phone all day. The child does not play. The child does not talk to friends. The phone shows many things. Some things are bad for children. Children need to read books. Children need to play. Children need to talk to family. A phone is okay sometimes. But not all day.`,

    A2: `Today, many young children have a smartphone. Parents often think it is a good thing. When the child is busy with the phone, the parents have time to rest. The child is quiet and does not ask for attention. But this can be a problem. Children use phones too much. They watch videos for many hours. They forget to play with other children. They forget to read books. Some videos are not safe for children. Parents do not always know what their children watch. Children need help from their parents to use the phone in a good way.`,

    B1: `For many parents, giving a smartphone to their child can feel like a great solution. When the child is busy with the phone, they stop crying, stop asking questions, and stop bothering the adults. The parent finally has a moment of peace. However, this short moment of quiet can quickly turn into a serious problem. When children spend too many hours on their phones every day, they can develop a kind of addiction. They lose interest in real activities, in friends, and even in their family. What makes it even more dangerous is that parents often do not know what their children are watching online. The internet is full of content that is not safe for young people: violent videos, harmful messages, and false ideas about the world. Statistics from countries like the UK show that mental health problems among young people are getting worse, and many experts believe that smartphones play a part in this. Technology is useful, but only if we use it wisely.`,

    B2: `To many parents, handing a smartphone to a restless child seems like the perfect solution. The crying stops, the questions stop, and the constant requests for attention finally fall silent. For a few precious minutes, or even hours, the household becomes calm. Yet this apparent moment of peace can easily turn into something far more troubling: a kind of dependency that shares some of the features of more familiar addictions. Although excessive smartphone use is not the same as addiction to alcohol or drugs, the long-term and uncontrolled exposure to digital content can have a serious impact on a child's psychological development. Even more worrying is the fact that, without proper supervision, children and teenagers are exposed to material that can completely distort their understanding of the world, of social relationships, and of their own identity. Disturbing data from the United Kingdom illustrates this trend clearly: rates of anxiety, depression, and other mental health problems among adolescents have been rising steadily, and many specialists point to digital devices as a major contributing factor. In the past, schools mainly dealt with the consequences of domestic violence or other difficult family situations that children brought from home. Today, the smartphone has been added to this list. Without parental guidance, it gives unrestricted access to an almost unimaginable amount of inappropriate content: violent, sexual, manipulative, or simply destructive. And the most troubling aspect of all is that parents often have no idea what their children are quietly watching behind a screen. Like all powerful tools, smartphones have their advantages, but only mindful and responsible use can protect us from disaster.`,

    C1: `For exhausted parents, handing a smartphone to a restless child can seem like nothing short of a miracle. The shouting ceases, the endless demands for attention evaporate, and a fragile silence descends upon the household. The child appears occupied, safely entertained, and crucially no longer disruptive. And yet, what looks like a hard-won moment of tranquillity is, more often than not, the first step toward something considerably more troubling: a quiet but persistent form of dependency that exhibits several of the hallmarks of more conventional addictions. While excessive smartphone use is not, strictly speaking, equivalent to substance abuse, the prolonged and unsupervised consumption of digital content can exert a profoundly detrimental effect on a child's emotional and cognitive development. Even more alarming, the absence of any meaningful oversight regarding what children and adolescents actually encounter online can distort their perception of the world, undermine their capacity to form healthy social bonds, and erode their fragile sense of identity. The unsettling data emerging from the United Kingdom, where rates of depression, anxiety, and self-harm among young people have continued to climb at an alarming pace, offers little comfort in this respect. Where previous generations of teachers were called upon to address the fallout from domestic violence and the various dysfunctions of family life, today's educators face an additional and far more insidious adversary: the smartphone itself. Unsupervised, this small device grants unfettered access to an almost inconceivable volume of unsuitable material — content that is brutal, sexualised, manipulative, or otherwise corrosive to a developing mind. And, perhaps most troublingly of all, parents are frequently unaware of what their children are quietly absorbing in the privacy of their own rooms, the glow of a screen the only witness to their experiences. Every powerful technology, of course, brings both rewards and risks. It is only through thoughtful, measured, and consistently supervised use that we can hope to enjoy the genuine benefits of digital devices without falling prey to their many hazards.`,

    C2: `For the harried, sleep-deprived parent, the smartphone often presents itself with all the seductive ease of a deus ex machina: hand the device to a fractious child, and within seconds the shouting subsides, the relentless demands for engagement dissolve into screen-fixated silence, and the household, against all reasonable expectation, settles into something resembling peace. The child looks contented, even productively absorbed; the adult, mercifully released, retrieves a fragment of the autonomy that parenthood so persistently confiscates. And yet, as with so many bargains struck under duress, the terms of this transaction tend to reveal themselves only later — and rarely on terms that the parent would have knowingly accepted. What appears, on the surface, to be a sustainable mechanism for restoring domestic equilibrium is in fact, with disconcerting frequency, the inaugural movement of a process whose conclusion bears more than a passing resemblance to addiction in its more conventional forms. To insist that compulsive smartphone use is precisely analogous to dependency upon psychoactive substances would be to overstate the case; the underlying neurochemistry, the social context, and the trajectories of recovery differ in important respects. Nevertheless, the prolonged, unregulated, and largely unsupervised exposure of children to digital content is now widely understood to exert effects upon developing minds that are, at best, ambivalent and, at worst, profoundly corrosive — encompassing diminished attention spans, impoverished social skills, fractured sleep architecture, and, with depressing regularity, the slow erosion of emotional resilience. More troubling still is the question — too rarely posed with the urgency it deserves — of what, precisely, children and adolescents actually encounter once a screen is placed in their hands and the door is closed behind them. Without the watchful intermediary of an attentive adult, the digital landscape unfolds before them as a territory at once exhilarating and treacherous: a place in which carefully curated misinformation, pornographic material of escalating intensity, manipulative ideological content, and a relentless stream of comparison-driven imagery jostle for the developing imagination. The consequences, predictably, can be discerned in distorted conceptions of reality, in stunted capacities for genuine social connection, and in the painful disorientation of identity that increasingly characterises adolescent experience. The statistics emerging from the United Kingdom in recent years — climbing rates of depression, of anxiety disorders, of self-harm and suicidal ideation among the young — speak with a brutal eloquence that no responsible observer can afford to ignore. A generation ago, the school corridor served as the unhappy receptacle into which the violence, neglect, and dysfunction of the domestic sphere were inevitably transposed; the alert teacher could often discern in the bruised arm or the absent gaze the silent traces of a difficult household. Today, that familiar repertoire of harms has been supplemented — and, in many cases, eclipsed — by a phenomenon whose contours teachers, parents, and clinicians are still struggling to map: the omnipresent, unmediated, and almost inexhaustible influence of the smartphone. And perhaps the most disquieting feature of this new reality is its essentially invisible character. Where past forms of harm announced themselves through audible argument or visible wound, the present generation of dangers unfolds in absolute silence, behind the modest barrier of a closed bedroom door, beneath the soft, persistent glow of a screen whose images no adult has thought, or dared, or known to inspect. It is a commonplace, and a true one, that no powerful technology is, in itself, either good or evil; the smartphone is no exception. But to leave so consequential an instrument unmoderated in the hands of those least equipped to navigate its hazards is, in effect, to abdicate one of the more demanding responsibilities that parenthood entails. Only through cultivated mindfulness, informed regulation, and — above all — sustained adult attention can we hope to preserve, for our children, the genuine and considerable benefits that these devices undeniably offer, while sparing them the slow-motion catastrophe that an unsupervised digital childhood now appears, with worrying clarity, to invite.`
  },
  questions: {
    tprs: [
      { q: "Why do parents often give a smartphone to their child?", a: "Because the child becomes quiet and stops bothering them." },
      { q: "Is it good or bad for a child to be on the phone all day?", a: "Bad — the child does not play or talk to others." },
      { q: "Can excessive phone use become an addiction?", a: "Yes, the text says it shares features of other addictions." },
      { q: "What kind of content can children find online without supervision?", a: "Violent, sexual, manipulative or harmful content." },
      { q: "Which country is mentioned for rising mental health problems?", a: "The United Kingdom." },
      { q: "Do parents always know what their children watch?", a: "No, often they have no idea." },
      { q: "And you — do you spend too much time on your phone?", a: "" }
    ],
    comprehension: [
      { type:'mc', q: "According to the text, what does handing a smartphone seem like to many parents?",
        options:["a punishment","a perfect solution","a danger","a waste of time"], correct: 1 },
      { type:'tf', q: "The text says smartphone addiction is exactly the same as drug addiction.", correct: false },
      { type:'mc', q: "Which country's data is mentioned in the text?",
        options:["Germany","France","The United Kingdom","Japan"], correct: 2 },
      { type:'open', q: "What can parents do to protect their children from harmful online content?" }
    ]
  },
  translations: { pl: SMARTPHONE_PL },
  audio: { A1:null, A2:null, B1:null, B2:null, C1:null, C2:null }
},
{
  id: 'demo-ru-smartphone',
  title: 'Ловушка смартфона',
  language: 'ru',
  levels: {
    A1: `Телефон маленький. У детей часто есть телефон. Родители рады. Ребёнок тихий. Ребёнок не плачет. Но это плохо. Ребёнок весь день в телефоне. Ребёнок не играет. Ребёнок не говорит с друзьями. В телефоне много вещей. Некоторые вещи плохие. Дети должны читать книги. Дети должны играть. Дети должны говорить с семьёй. Телефон — это иногда хорошо. Но не весь день.`,

    A2: `Сегодня у многих маленьких детей есть смартфон. Родители часто думают, что это хорошо. Когда ребёнок занят телефоном, у родителей есть время отдохнуть. Ребёнок тихий и ничего не просит. Но это может быть проблемой. Дети слишком долго сидят в телефоне. Они смотрят видео много часов. Они забывают играть с другими детьми. Они забывают читать книги. Некоторые видео не подходят для детей. Родители не всегда знают, что смотрят их дети. Детям нужна помощь родителей, чтобы пользоваться телефоном правильно.`,

    B1: `Для многих родителей дать ребёнку смартфон — это, кажется, отличное решение. Когда ребёнок занят телефоном, он перестаёт плакать, перестаёт задавать вопросы и не мешает взрослым. Наконец у родителей появляется немного покоя. Однако этот короткий момент тишины может быстро превратиться в серьёзную проблему. Когда дети проводят слишком много часов в телефоне каждый день, у них может развиться своего рода зависимость. Они теряют интерес к настоящим занятиям, к друзьям и даже к своей семье. Что делает ситуацию ещё опаснее — родители часто не знают, что их дети смотрят в интернете. В сети полно контента, который небезопасен для молодых: жестокие видео, вредные сообщения, ложные представления о мире. Статистика из таких стран, как Великобритания, показывает, что психические проблемы среди молодёжи становятся всё хуже, и многие специалисты считают, что смартфоны играют в этом большую роль. Технологии полезны, но только если использовать их разумно.`,

    B2: `Для многих родителей вручить смартфон беспокойному ребёнку кажется идеальным решением. Плач прекращается, вопросы стихают, а постоянные требования внимания наконец-то замолкают. На несколько драгоценных минут, а иногда и часов, дом погружается в тишину. И всё же эта кажущаяся минута покоя легко может превратиться в нечто гораздо более тревожное: своего рода зависимость, обладающую некоторыми чертами более привычных нам пристрастий. Хотя чрезмерное использование смартфона нельзя приравнивать к зависимости от алкоголя или наркотиков, длительное и неконтролируемое погружение в цифровой контент способно оказать серьёзное влияние на психическое развитие ребёнка. Ещё больше беспокоит то, что без должного надзора дети и подростки сталкиваются с материалами, которые могут полностью исказить их представление о мире, о социальных отношениях и о собственной идентичности. Тревожные данные из Великобритании ясно иллюстрируют эту тенденцию: уровень тревожности, депрессии и других психических расстройств среди подростков неуклонно растёт, и многие специалисты указывают на цифровые устройства как на главный фактор. Раньше школы в основном имели дело с последствиями домашнего насилия и других тяжёлых семейных ситуаций, которые дети приносили из дома. Сегодня к этому списку добавился смартфон. Без родительского контроля он даёт неограниченный доступ к почти невообразимому количеству неподходящего контента: жестокого, сексуального, манипулятивного или просто разрушительного. И самое тревожное — родители часто понятия не имеют, что их дети молча смотрят за экраном. Как и любой мощный инструмент, смартфоны имеют свои преимущества, но только осознанное и ответственное использование может уберечь нас от катастрофы.`,

    C1: `Для уставших родителей вручить смартфон беспокойному ребёнку может показаться почти чудом. Крик прекращается, бесконечные требования внимания исчезают, и над домом опускается хрупкая тишина. Ребёнок выглядит занятым, безопасно увлечённым и, что особенно важно, больше не мешает. И всё же то, что кажется заслуженной минутой покоя, чаще всего оказывается первым шагом к чему-то гораздо более тревожному: тихой, но настойчивой форме зависимости, обладающей рядом признаков более привычных нам пристрастий. Хотя чрезмерное использование смартфона, строго говоря, нельзя приравнивать к злоупотреблению психоактивными веществами, длительное и бесконтрольное потребление цифрового контента может оказывать глубоко разрушительное воздействие на эмоциональное и когнитивное развитие ребёнка. Ещё тревожнее тот факт, что отсутствие сколько-нибудь значимого надзора за тем, с чем именно дети и подростки сталкиваются в сети, способно исказить их восприятие мира, подорвать способность выстраивать здоровые социальные связи и разрушить хрупкое чувство собственной идентичности. Тревожные данные из Великобритании, где уровень депрессии, тревожных расстройств и самоповреждений среди молодёжи продолжает расти угрожающими темпами, не оставляют поводов для оптимизма. Если прежним поколениям учителей приходилось разбираться с последствиями домашнего насилия и различных дисфункций семейной жизни, то сегодня педагоги столкнулись с дополнительным и куда более коварным противником — самим смартфоном. Без надзора это маленькое устройство открывает беспрепятственный доступ к почти непостижимому объёму неподходящего материала — контента, который может быть жестоким, сексуализированным, манипулятивным или просто разрушительным для формирующегося сознания. И, пожалуй, самое тревожное — родители нередко не подозревают, что именно их дети молча впитывают в уединении своих комнат, где единственным свидетелем их переживаний остаётся свет экрана. Любая мощная технология, разумеется, несёт с собой как преимущества, так и риски. Лишь осознанное, взвешенное и постоянно контролируемое использование позволит нам получать подлинную пользу от цифровых устройств, не становясь жертвами их многочисленных опасностей.`,

    C2: `Для измотанного, лишённого сна родителя смартфон нередко предстаёт со всей соблазнительной лёгкостью какого-нибудь deus ex machina: достаточно вручить устройство капризному ребёнку, и в считанные секунды крик стихает, бесконечные требования внимания растворяются в экранно-поглощённой тишине, а дом, вопреки всякому разумному ожиданию, погружается в нечто, отдалённо напоминающее покой. Ребёнок выглядит довольным, едва ли не продуктивно увлечённым; взрослый, милостиво освобождённый, обретает крупицу той автономии, которую отцовство и материнство так настойчиво конфискуют. И всё же, как часто бывает со сделками, заключёнными в минуту слабости, условия этой сделки имеют обыкновение проявляться значительно позже — и в формах, которые родитель едва ли согласился бы принять, будь они оглашены заранее. То, что на первый взгляд представляется устойчивым механизмом восстановления домашнего равновесия, оказывается на деле, и с поразительной регулярностью, первым актом процесса, чьи финальные сцены имеют немало общего с зависимостью в её более привычных формах. Утверждать, что компульсивное использование смартфона полностью аналогично пристрастию к психоактивным веществам, означало бы преувеличить дело: нейрохимия, социальный контекст и траектории восстановления существенно различаются. Тем не менее длительное, бесконтрольное и в значительной мере ненаблюдаемое погружение детей в цифровой контент сегодня широко признаётся фактором, оказывающим на развивающееся сознание влияние, в лучшем случае двусмысленное, а в худшем — глубоко разрушительное: оно затрагивает способность к сосредоточенности, обедняет навыки общения, дезорганизует структуру сна и, с удручающей регулярностью, медленно подтачивает эмоциональную устойчивость. Ещё тревожнее — вопрос, который слишком редко задаётся с подобающей ему остротой: что именно дети и подростки на самом деле видят, как только экран оказывается в их руках, а дверь за ними закрыта. Без бдительного посредничества внимательного взрослого цифровой ландшафт разворачивается перед ними как территория, одновременно завораживающая и предательская: место, где тщательно подобранные дезинформация, порнографические материалы нарастающей интенсивности, манипулятивный идеологический контент и неостановимый поток образов, рассчитанных на сравнение себя с другими, состязаются за формирующееся воображение. Последствия, как и следовало ожидать, обнаруживаются в искажённых представлениях о действительности, в недоразвитых способностях к подлинной социальной связи и в мучительной растерянности подростковой идентичности. Статистика последних лет из Великобритании — растущие показатели депрессии, тревожных расстройств, самоповреждений и суицидальных мыслей среди молодёжи — говорит языком, который ни один ответственный наблюдатель не вправе игнорировать. Поколение назад школьный коридор служил тем несчастным сосудом, в который неминуемо переливались насилие, пренебрежение и дисфункция семейной жизни; внимательный учитель нередко мог различить в синяке на руке или в отсутствующем взгляде безмолвные следы трудного дома. Сегодня этот привычный репертуар вреда дополнен — а во многих случаях и затенён — явлением, очертания которого учителя, родители и клиницисты ещё только пытаются осмыслить: вездесущим, неопосредованным и почти неистощимым влиянием смартфона. И, пожалуй, самой тревожной чертой этой новой реальности является её по сути невидимый характер. Если прежние формы вреда заявляли о себе слышимым спором или зримой раной, то нынешнее поколение опасностей разворачивается в абсолютной тишине, за скромной преградой закрытой двери в детскую, под мягким, настойчивым светом экрана, образы которого ни один взрослый не подумал, не посмел или не догадался проверить. Как известно, никакая мощная технология не является сама по себе ни доброй, ни злой; смартфон не исключение. Однако оставить столь значительный инструмент бесконтрольным в руках тех, кто менее всего способен ориентироваться в его опасностях, означает, по сути, отказаться от одной из самых требовательных обязанностей, которые накладывает родительство. Лишь через воспитанную внимательность, осознанное регулирование и — что важнее всего — постоянное взрослое присутствие мы можем надеяться сохранить для наших детей подлинные и немалые блага, которые эти устройства, бесспорно, предлагают, оберегая их при этом от той медленной катастрофы, к которой бесконтрольное цифровое детство, как становится всё яснее, всё настойчивее ведёт.`
  },
  questions: {
    tprs: [
      { q: "Почему родители часто дают ребёнку смартфон?", a: "Потому что ребёнок становится тихим и не мешает." },
      { q: "Хорошо или плохо, когда ребёнок весь день в телефоне?", a: "Плохо — он не играет и не общается." },
      { q: "Может ли чрезмерное использование телефона стать зависимостью?", a: "Да, у этого есть черты других зависимостей." },
      { q: "Какой контент дети могут найти в интернете без надзора?", a: "Жестокий, сексуальный, манипулятивный или вредный." },
      { q: "Какая страна упоминается в тексте?", a: "Великобритания." },
      { q: "Всегда ли родители знают, что смотрят их дети?", a: "Нет, часто они не знают." },
      { q: "А ты — слишком много времени проводишь в телефоне?", a: "" }
    ],
    comprehension: [
      { type:'mc', q: "Чем кажется смартфон многим родителям, согласно тексту?",
        options:["наказанием","идеальным решением","опасностью","пустой тратой времени"], correct: 1 },
      { type:'tf', q: "Текст утверждает, что зависимость от смартфона полностью идентична наркотической.", correct: false },
      { type:'mc', q: "Какая страна упоминается в тексте?",
        options:["Германия","Франция","Великобритания","Япония"], correct: 2 },
      { type:'open', q: "Что родители могут сделать, чтобы защитить ребёнка от вредного контента?" }
    ]
  },
  translations: { pl: SMARTPHONE_PL },
  audio: { A1:null, A2:null, B1:null, B2:null, C1:null, C2:null }
},
{
  id: 'demo-de-smartphone',
  title: 'Die Smartphone-Falle',
  language: 'de',
  levels: {
    A1: `Ein Handy ist klein. Viele Kinder haben ein Handy. Die Eltern sind froh. Das Kind ist ruhig. Das Kind weint nicht. Aber das ist nicht gut. Das Kind ist den ganzen Tag am Handy. Das Kind spielt nicht. Das Kind spricht nicht mit Freunden. Das Handy zeigt viele Dinge. Manche Dinge sind schlecht für Kinder. Kinder sollen Bücher lesen. Kinder sollen spielen. Kinder sollen mit der Familie sprechen. Ein Handy ist manchmal okay. Aber nicht den ganzen Tag.`,

    A2: `Heute haben viele kleine Kinder ein Smartphone. Eltern denken oft, das ist eine gute Sache. Wenn das Kind mit dem Handy beschäftigt ist, haben die Eltern Zeit zum Ausruhen. Das Kind ist ruhig und braucht keine Aufmerksamkeit. Aber das kann ein Problem sein. Kinder benutzen Handys zu viel. Sie schauen viele Stunden Videos. Sie vergessen, mit anderen Kindern zu spielen. Sie vergessen, Bücher zu lesen. Manche Videos sind nicht für Kinder geeignet. Eltern wissen nicht immer, was ihre Kinder anschauen. Kinder brauchen Hilfe von ihren Eltern, um das Handy richtig zu benutzen.`,

    B1: `Für viele Eltern erscheint es als großartige Lösung, ihrem Kind ein Smartphone zu geben. Wenn das Kind mit dem Handy beschäftigt ist, hört es auf zu weinen, hört auf, Fragen zu stellen, und stört die Erwachsenen nicht mehr. Die Eltern haben endlich einen Moment der Ruhe. Doch dieser kurze Augenblick der Stille kann sich schnell in ein ernstes Problem verwandeln. Wenn Kinder jeden Tag zu viele Stunden mit ihrem Handy verbringen, kann sich eine Art Abhängigkeit entwickeln. Sie verlieren das Interesse an echten Aktivitäten, an Freunden und sogar an der eigenen Familie. Was die Situation noch gefährlicher macht: Eltern wissen oft nicht, was ihre Kinder im Internet anschauen. Das Netz ist voll von Inhalten, die für junge Menschen nicht sicher sind – gewalttätige Videos, schädliche Botschaften und falsche Vorstellungen von der Welt. Statistiken aus Ländern wie Großbritannien zeigen, dass psychische Probleme unter jungen Menschen immer schlimmer werden, und viele Fachleute glauben, dass Smartphones eine wichtige Rolle spielen. Technologie ist nützlich, aber nur, wenn wir sie klug einsetzen.`,

    B2: `Für viele Eltern erscheint es geradezu wie die ideale Lösung, einem unruhigen Kind ein Smartphone in die Hand zu drücken. Das Weinen hört auf, die Fragen verstummen, und die ständigen Forderungen nach Aufmerksamkeit verklingen schließlich. Für einige kostbare Minuten – manchmal sogar Stunden – wird es im Haushalt ruhig. Doch dieser scheinbare Moment des Friedens kann sich leicht in etwas weit Beunruhigenderes verwandeln: in eine Art Abhängigkeit, die einige der Merkmale klassischer Süchte teilt. Auch wenn übermäßige Smartphone-Nutzung nicht mit Abhängigkeit von Alkohol oder Drogen gleichgesetzt werden kann, kann der langfristige und unkontrollierte Konsum digitaler Inhalte erhebliche Auswirkungen auf die psychische Entwicklung eines Kindes haben. Noch besorgniserregender ist die Tatsache, dass Kinder und Jugendliche ohne angemessene Aufsicht mit Inhalten konfrontiert werden, die ihr Verständnis von der Welt, von sozialen Beziehungen und von der eigenen Identität völlig verzerren können. Beunruhigende Daten aus Großbritannien veranschaulichen diesen Trend deutlich: Die Raten von Angstzuständen, Depressionen und anderen psychischen Problemen unter Jugendlichen steigen kontinuierlich, und viele Experten verweisen auf digitale Geräte als wichtigen Mitverursacher. Früher hatten Schulen vor allem mit den Folgen häuslicher Gewalt und anderer schwieriger familiärer Verhältnisse zu tun, die die Kinder von zu Hause mitbrachten. Heute kommt das Smartphone als zusätzlicher Faktor hinzu. Ohne elterliche Kontrolle gewährt es unbegrenzten Zugang zu einer kaum vorstellbaren Menge unangemessener Inhalte: gewalttätig, sexualisiert, manipulativ oder einfach zerstörerisch. Und am beunruhigendsten ist, dass Eltern oft keine Ahnung haben, was ihre Kinder im Stillen hinter dem Bildschirm konsumieren. Wie jedes mächtige Werkzeug haben auch Smartphones ihre Vorteile, aber nur ein bewusster und verantwortungsvoller Umgang kann uns vor einer Katastrophe bewahren.`,

    C1: `Für erschöpfte Eltern kann es geradezu wie ein Wunder wirken, einem unruhigen Kind ein Smartphone in die Hand zu drücken. Das Geschrei verstummt, die endlosen Forderungen nach Aufmerksamkeit lösen sich auf, und über dem Haushalt legt sich eine fragile Stille. Das Kind wirkt beschäftigt, scheinbar sicher unterhalten und – was entscheidend ist – nicht länger störend. Und doch erweist sich das, was wie ein hart erkämpfter Moment der Ruhe aussieht, allzu oft als der erste Schritt zu etwas erheblich Beunruhigenderem: einer leisen, aber hartnäckigen Form der Abhängigkeit, die mehrere Merkmale klassischer Suchterkrankungen aufweist. Obwohl exzessive Smartphone-Nutzung streng genommen nicht mit Substanzmissbrauch gleichzusetzen ist, kann der lang anhaltende und unbeaufsichtigte Konsum digitaler Inhalte eine zutiefst nachteilige Wirkung auf die emotionale und kognitive Entwicklung eines Kindes ausüben. Noch alarmierender ist, dass das Fehlen jeglicher sinnvollen Aufsicht darüber, womit Kinder und Jugendliche im Netz tatsächlich in Berührung kommen, ihre Wahrnehmung der Welt verzerren, ihre Fähigkeit zur Bildung gesunder sozialer Bindungen untergraben und ihr ohnehin fragiles Identitätsgefühl erodieren kann. Die beunruhigenden Daten aus Großbritannien – wo die Raten von Depressionen, Angststörungen und Selbstverletzung unter jungen Menschen in alarmierendem Tempo weiter steigen – bieten in dieser Hinsicht wenig Trost. Während frühere Lehrergenerationen mit den Folgen häuslicher Gewalt und verschiedenster familiärer Dysfunktionen zu kämpfen hatten, sehen sich heutige Pädagogen einem zusätzlichen und weitaus tückischeren Gegner gegenüber: dem Smartphone selbst. Unbeaufsichtigt gewährt dieses kleine Gerät einen ungehinderten Zugang zu einer kaum vorstellbaren Menge ungeeigneten Materials – Inhalte, die brutal, sexualisiert, manipulativ oder schlicht zerstörerisch für einen sich entwickelnden Geist sind. Und vielleicht am verstörendsten ist, dass Eltern häufig nicht ahnen, was ihre Kinder in der Privatsphäre ihrer Zimmer still in sich aufnehmen, wobei das Licht eines Bildschirms der einzige Zeuge ihrer Erfahrungen bleibt. Jede mächtige Technologie bringt selbstverständlich sowohl Chancen als auch Risiken mit sich. Nur durch einen bewussten, abgewogenen und konsequent beaufsichtigten Umgang können wir hoffen, die echten und beträchtlichen Vorteile digitaler Geräte zu genießen, ohne ihren vielfältigen Gefahren zu erliegen.`,

    C2: `Für die erschöpften, schlafentwöhnten Eltern stellt sich das Smartphone nicht selten mit der verführerischen Leichtigkeit eines deus ex machina dar: man drückt einem unruhigen Kind das Gerät in die Hand – und binnen Sekunden verstummt das Geschrei, lösen sich die unaufhörlichen Forderungen nach Aufmerksamkeit in bildschirmgebannter Stille auf, und der Haushalt versinkt, wider jede vernünftige Erwartung, in etwas, das einem Zustand der Ruhe nicht unähnlich ist. Das Kind wirkt zufrieden, ja beinahe produktiv vertieft; der Erwachsene, gnädig befreit, gewinnt einen Bruchteil jener Autonomie zurück, die das Elternsein mit so hartnäckiger Beharrlichkeit konfisziert. Und doch, wie es bei so vielen unter Zwang abgeschlossenen Geschäften der Fall ist, offenbaren sich die Bedingungen dieser Transaktion meist erst später – und nur selten zu Konditionen, die der Elternteil wissentlich akzeptiert hätte. Was an der Oberfläche als nachhaltiger Mechanismus zur Wiederherstellung des häuslichen Gleichgewichts erscheint, erweist sich in Wirklichkeit, und mit beunruhigender Regelmäßigkeit, als die erste Bewegung eines Prozesses, dessen Schlussszenen mehr als nur eine flüchtige Ähnlichkeit mit Abhängigkeitsformen aufweisen, die wir aus klassischen Suchterkrankungen kennen. Zu behaupten, der zwanghafte Gebrauch des Smartphones sei exakt analog zur Abhängigkeit von psychoaktiven Substanzen, hieße freilich, die Sache zu überspitzen: die zugrunde liegende Neurochemie, der soziale Kontext und die Wege der Genesung unterscheiden sich in wesentlichen Punkten. Gleichwohl gilt der lang anhaltende, unregulierte und weitgehend unbeaufsichtigte Konsum digitaler Inhalte durch Kinder heute weithin als ein Faktor, der auf sich entwickelnde Geister Wirkungen entfaltet, die im besten Fall ambivalent, im schlimmsten zutiefst zersetzend sind: er beeinträchtigt das Konzentrationsvermögen, verkümmert die Fähigkeit zur sozialen Interaktion, zerrüttet die Schlafarchitektur und untergräbt mit deprimierender Regelmäßigkeit die emotionale Widerstandskraft. Noch beunruhigender ist die Frage – zu selten mit der ihr angemessenen Dringlichkeit gestellt – , was Kinder und Jugendliche tatsächlich zu sehen bekommen, sobald ein Bildschirm in ihren Händen liegt und die Tür hinter ihnen geschlossen ist. Ohne die wachsame Vermittlung eines aufmerksamen Erwachsenen entfaltet sich die digitale Landschaft vor ihnen als ein zugleich faszinierendes und tückisches Terrain: ein Ort, an dem sorgfältig kuratierte Falschinformation, pornographisches Material zunehmender Intensität, manipulative ideologische Inhalte und ein unaufhörlicher Strom vergleichsorientierter Bilder um die sich entwickelnde Vorstellungskraft konkurrieren. Die Folgen lassen sich, wie zu erwarten war, in verzerrten Realitätsvorstellungen, verkümmerten Fähigkeiten zu echter sozialer Verbundenheit und in der schmerzhaften Orientierungslosigkeit erkennen, die das Erleben von Jugendlichen zunehmend prägt. Die Statistiken, die in den letzten Jahren aus Großbritannien stammen – steigende Raten von Depression, Angststörungen, Selbstverletzung und Suizidgedanken unter Jugendlichen – sprechen eine Sprache, die kein verantwortungsbewusster Beobachter überhören kann. Vor einer Generation diente der Schulflur als jenes unglückliche Gefäß, in das die Gewalt, Vernachlässigung und Dysfunktion der häuslichen Sphäre unausweichlich überzuschwappen pflegte; ein aufmerksamer Lehrer konnte häufig im verletzten Arm oder im abwesenden Blick die stillen Spuren eines schwierigen Elternhauses erkennen. Heute ist dieses vertraute Schadenrepertoire ergänzt worden – und in vielen Fällen überlagert – durch ein Phänomen, dessen Konturen Lehrer, Eltern und Therapeuten erst zu erfassen beginnen: den allgegenwärtigen, unvermittelten und nahezu unerschöpflichen Einfluss des Smartphones. Und vielleicht das beunruhigendste Merkmal dieser neuen Realität ist ihr im Wesentlichen unsichtbarer Charakter. Wo sich vergangene Formen des Schadens durch hörbaren Streit oder sichtbare Wunden zu erkennen gaben, entfaltet sich die heutige Generation der Gefahren in absoluter Stille, hinter der bescheidenen Barriere einer geschlossenen Kinderzimmertür, im sanften, beharrlichen Licht eines Bildschirms, dessen Bilder kein Erwachsener daran gedacht, gewagt oder gewusst hat zu prüfen. Es ist eine Binsenweisheit, und eine zutreffende dazu, dass keine mächtige Technologie an sich gut oder böse ist; das Smartphone bildet hier keine Ausnahme. Ein so folgenschweres Instrument jedoch unmoderiert in den Händen derjenigen zu belassen, die am wenigsten gerüstet sind, seine Gefahren zu navigieren, bedeutet im Grunde, eine der anspruchsvollsten Verantwortlichkeiten abzudanken, die das Elternsein mit sich bringt. Nur durch kultivierte Achtsamkeit, informierte Regulierung und – vor allem – durch anhaltende Aufmerksamkeit der Erwachsenen können wir hoffen, unseren Kindern die echten und beträchtlichen Vorteile dieser Geräte zu bewahren, während wir ihnen die langsame Katastrophe ersparen, zu der ein unbeaufsichtigtes digitales Aufwachsen, wie sich mit beunruhigender Klarheit zeigt, einlädt.`
  },
  questions: {
    tprs: [
      { q: "Warum geben Eltern ihren Kindern oft ein Smartphone?", a: "Weil das Kind ruhig wird und nicht stört." },
      { q: "Ist es gut oder schlecht, wenn ein Kind den ganzen Tag am Handy ist?", a: "Schlecht – das Kind spielt und spricht nicht mit anderen." },
      { q: "Kann übermäßige Handynutzung zu Abhängigkeit werden?", a: "Ja, sie hat Merkmale anderer Süchte." },
      { q: "Welche Inhalte können Kinder ohne Aufsicht im Netz finden?", a: "Gewalttätige, sexuelle oder manipulative Inhalte." },
      { q: "Welches Land wird im Text erwähnt?", a: "Großbritannien." },
      { q: "Wissen Eltern immer, was ihre Kinder anschauen?", a: "Nein, oft haben sie keine Ahnung." },
      { q: "Und du – verbringst du zu viel Zeit am Handy?", a: "" }
    ],
    comprehension: [
      { type:'mc', q: "Wie erscheint das Smartphone vielen Eltern laut Text?",
        options:["als Strafe","als ideale Lösung","als Gefahr","als Zeitverschwendung"], correct: 1 },
      { type:'tf', q: "Der Text behauptet, Smartphone-Sucht sei genau dasselbe wie Drogensucht.", correct: false },
      { type:'mc', q: "Welches Land wird im Text erwähnt?",
        options:["Deutschland","Frankreich","Großbritannien","Japan"], correct: 2 },
      { type:'open', q: "Was können Eltern tun, um ihre Kinder vor schädlichen Inhalten zu schützen?" }
    ]
  },
  translations: { pl: SMARTPHONE_PL },
  audio: { A1:null, A2:null, B1:null, B2:null, C1:null, C2:null }
},
{
  id: 'demo-fr-smartphone',
  title: 'Le piège du smartphone',
  language: 'fr',
  levels: {
    A1: `Un téléphone est petit. Beaucoup d'enfants ont un téléphone. Les parents sont contents. L'enfant est calme. L'enfant ne pleure pas. Mais ce n'est pas bien. L'enfant est sur le téléphone toute la journée. L'enfant ne joue pas. L'enfant ne parle pas avec ses amis. Le téléphone montre beaucoup de choses. Certaines choses sont mauvaises pour les enfants. Les enfants doivent lire des livres. Les enfants doivent jouer. Les enfants doivent parler avec la famille. Un téléphone, c'est parfois bien. Mais pas toute la journée.`,

    A2: `Aujourd'hui, beaucoup de jeunes enfants ont un smartphone. Les parents pensent souvent que c'est une bonne chose. Quand l'enfant est occupé avec le téléphone, les parents ont le temps de se reposer. L'enfant est calme et ne demande pas d'attention. Mais cela peut être un problème. Les enfants utilisent les téléphones trop souvent. Ils regardent des vidéos pendant de nombreuses heures. Ils oublient de jouer avec d'autres enfants. Ils oublient de lire des livres. Certaines vidéos ne sont pas adaptées aux enfants. Les parents ne savent pas toujours ce que regardent leurs enfants. Les enfants ont besoin de l'aide de leurs parents pour bien utiliser le téléphone.`,

    B1: `Pour beaucoup de parents, donner un smartphone à leur enfant semble être une excellente solution. Quand l'enfant est occupé avec le téléphone, il arrête de pleurer, arrête de poser des questions et ne dérange plus les adultes. Le parent a enfin un moment de tranquillité. Pourtant, ce court moment de silence peut rapidement se transformer en un problème sérieux. Quand les enfants passent trop d'heures sur leur téléphone chaque jour, ils peuvent développer une sorte de dépendance. Ils perdent l'intérêt pour les vraies activités, pour leurs amis et même pour leur famille. Ce qui rend la situation encore plus dangereuse, c'est que les parents ne savent souvent pas ce que regardent leurs enfants sur Internet. Le net est plein de contenus qui ne sont pas sûrs pour les jeunes : vidéos violentes, messages nocifs et fausses idées sur le monde. Les statistiques de pays comme le Royaume-Uni montrent que les problèmes de santé mentale chez les jeunes empirent, et de nombreux experts pensent que les smartphones jouent un rôle important. La technologie est utile, mais seulement si on l'utilise avec sagesse.`,

    B2: `Pour de nombreux parents, mettre un smartphone dans les mains d'un enfant agité semble être la solution parfaite. Les pleurs s'arrêtent, les questions cessent, et les demandes constantes d'attention finissent par se taire. Pendant quelques précieuses minutes, voire quelques heures, le foyer devient calme. Pourtant, ce moment apparent de paix peut facilement se transformer en quelque chose de bien plus inquiétant : une sorte de dépendance qui partage certaines caractéristiques avec des addictions plus connues. Même si l'utilisation excessive du smartphone ne peut être assimilée à une dépendance à l'alcool ou aux drogues, l'exposition prolongée et incontrôlée à du contenu numérique peut avoir un impact sérieux sur le développement psychique d'un enfant. Ce qui est encore plus préoccupant, c'est que, sans surveillance adéquate, les enfants et les adolescents sont exposés à des contenus qui peuvent totalement déformer leur compréhension du monde, des relations sociales et de leur propre identité. Des données alarmantes du Royaume-Uni illustrent clairement cette tendance : les taux d'anxiété, de dépression et d'autres troubles mentaux chez les adolescents augmentent régulièrement, et de nombreux spécialistes pointent du doigt les appareils numériques comme un facteur majeur. Autrefois, les écoles devaient surtout faire face aux conséquences de la violence domestique et d'autres situations familiales difficiles que les enfants apportaient de chez eux. Aujourd'hui, le smartphone s'ajoute à cette liste. Sans contrôle parental, il donne un accès illimité à une quantité presque inimaginable de contenu inapproprié : violent, sexuel, manipulateur ou simplement destructeur. Et l'aspect le plus troublant est que les parents n'ont souvent aucune idée de ce que leurs enfants regardent silencieusement derrière un écran. Comme tout outil puissant, les smartphones ont leurs avantages, mais seul un usage conscient et responsable peut nous protéger d'une catastrophe.`,

    C1: `Pour les parents épuisés, mettre un smartphone entre les mains d'un enfant agité peut paraître relever du miracle. Les cris s'arrêtent, les demandes incessantes d'attention s'évaporent, et un silence fragile descend sur le foyer. L'enfant semble occupé, paisiblement diverti, et – fait crucial – ne dérange plus personne. Et pourtant, ce qui ressemble à un moment de tranquillité durement gagné se révèle bien souvent comme le premier pas vers quelque chose de considérablement plus inquiétant : une forme discrète mais tenace de dépendance qui présente plusieurs des traits caractéristiques des addictions plus classiques. Bien que l'usage excessif du smartphone ne soit pas, à proprement parler, équivalent à l'abus de substances, la consommation prolongée et non surveillée de contenus numériques peut exercer un effet profondément délétère sur le développement émotionnel et cognitif de l'enfant. Plus alarmant encore, l'absence de toute surveillance significative quant à ce que les enfants et les adolescents rencontrent réellement en ligne peut déformer leur perception du monde, miner leur capacité à former des liens sociaux sains et éroder leur sentiment d'identité, déjà fragile. Les données troublantes en provenance du Royaume-Uni, où les taux de dépression, d'anxiété et d'automutilation chez les jeunes ne cessent d'augmenter à un rythme alarmant, n'offrent guère de réconfort à cet égard. Là où les enseignants des générations précédentes étaient appelés à gérer les répercussions de la violence domestique et des divers dysfonctionnements de la vie familiale, les éducateurs d'aujourd'hui se trouvent confrontés à un adversaire supplémentaire et infiniment plus insidieux : le smartphone lui-même. Sans surveillance, ce petit appareil offre un accès illimité à une quantité presque inconcevable de matériel inadapté – des contenus brutaux, sexualisés, manipulateurs ou tout simplement corrosifs pour un esprit en formation. Et, peut-être plus inquiétant que tout, les parents ignorent fréquemment ce que leurs enfants absorbent silencieusement dans l'intimité de leur chambre, la lueur d'un écran restant le seul témoin de leur expérience. Toute technologie puissante apporte évidemment ses récompenses et ses risques. Ce n'est que par un usage réfléchi, mesuré et constamment encadré que nous pouvons espérer profiter des véritables et considérables bienfaits des appareils numériques sans tomber victimes de leurs nombreux périls.`,

    C2: `Pour le parent épuisé, privé de sommeil, le smartphone se présente souvent avec toute la séduisante facilité d'un deus ex machina : il suffit de tendre l'appareil à un enfant agité, et en quelques secondes les cris s'apaisent, les exigences incessantes d'attention se dissolvent dans un silence fasciné par l'écran, et le foyer, contre toute attente raisonnable, sombre dans quelque chose qui ressemble à la paix. L'enfant paraît content, presque productivement absorbé ; l'adulte, miséricordieusement libéré, retrouve un fragment de cette autonomie que la parentalité confisque avec une persistance si remarquable. Et pourtant, comme c'est si souvent le cas pour les marchés conclus dans la contrainte, les termes de cette transaction ne se révèlent qu'après coup – et rarement à des conditions que le parent aurait acceptées en toute connaissance de cause. Ce qui, en surface, apparaît comme un mécanisme durable de restauration de l'équilibre domestique se révèle en réalité, et avec une régularité déconcertante, comme le premier mouvement d'un processus dont la conclusion ne diffère guère d'une dépendance dans ses formes plus classiques. Soutenir que l'usage compulsif du smartphone est précisément analogue à une dépendance aux substances psychoactives serait exagérer le propos ; la neurochimie sous-jacente, le contexte social et les trajectoires de rétablissement diffèrent en des points importants. Néanmoins, l'exposition prolongée, non régulée et largement non surveillée des enfants au contenu numérique est aujourd'hui largement reconnue comme exerçant sur les esprits en développement des effets, au mieux ambivalents, au pire profondément délétères – touchant la capacité de concentration, appauvrissant les compétences sociales, fragmentant l'architecture du sommeil et, avec une régularité déprimante, érodant lentement la résilience émotionnelle. Plus troublante encore est la question – trop rarement posée avec l'urgence qu'elle mérite – de ce que rencontrent précisément les enfants et les adolescents une fois qu'un écran est placé entre leurs mains et que la porte se referme derrière eux. Sans la médiation vigilante d'un adulte attentif, le paysage numérique se déploie devant eux comme un territoire à la fois exaltant et perfide : un lieu où la désinformation soigneusement orchestrée, des contenus pornographiques d'intensité croissante, des contenus idéologiques manipulateurs et un flux ininterrompu d'images destinées à la comparaison sociale rivalisent pour l'imagination en formation. Les conséquences, comme on pouvait s'y attendre, se laissent percevoir dans des conceptions déformées de la réalité, dans des capacités étiolées de connexion sociale authentique, et dans la douloureuse désorientation identitaire qui caractérise de plus en plus l'expérience adolescente. Les statistiques qui émergent du Royaume-Uni ces dernières années – taux croissants de dépression, de troubles anxieux, d'automutilations et d'idéations suicidaires chez les jeunes – parlent une langue qu'aucun observateur responsable ne saurait ignorer. Il y a une génération, le couloir scolaire servait de réceptacle malheureux dans lequel se déversait inévitablement la violence, la négligence et le dysfonctionnement de la sphère domestique ; l'enseignant attentif pouvait souvent discerner, dans le bras meurtri ou le regard absent, les traces silencieuses d'un foyer difficile. Aujourd'hui, ce répertoire familier de préjudices s'est vu enrichi – et, dans bien des cas, éclipsé – par un phénomène dont les enseignants, les parents et les cliniciens commencent à peine à dessiner les contours : l'influence omniprésente, immédiate et presque inépuisable du smartphone. Et peut-être la caractéristique la plus troublante de cette nouvelle réalité est-elle son caractère essentiellement invisible. Là où les formes passées de préjudice s'annonçaient par une dispute audible ou une blessure visible, la génération actuelle de dangers se déploie dans un silence absolu, derrière la modeste barrière d'une porte de chambre fermée, sous la lueur douce et persistante d'un écran dont aucun adulte n'a pensé, osé ou su examiner les images. C'est un lieu commun, et vrai d'ailleurs, qu'aucune technologie puissante n'est en soi bonne ou mauvaise ; le smartphone ne fait pas exception. Mais laisser un instrument aussi lourd de conséquences sans modération entre les mains de ceux qui sont les moins équipés pour en naviguer les périls revient, en somme, à abdiquer l'une des responsabilités les plus exigeantes qu'implique la parentalité. Ce n'est qu'à travers une attention cultivée, une régulation informée et – surtout – une présence adulte soutenue que nous pouvons espérer préserver pour nos enfants les bénéfices authentiques et considérables qu'offrent indéniablement ces appareils, tout en leur épargnant la catastrophe au ralenti à laquelle une enfance numérique non surveillée semble désormais, avec une clarté inquiétante, mener.`
  },
  questions: {
    tprs: [
      { q: "Pourquoi les parents donnent-ils souvent un smartphone à leur enfant ?", a: "Parce que l'enfant devient calme et ne dérange plus." },
      { q: "Est-ce bien ou mal pour un enfant d'être sur le téléphone toute la journée ?", a: "Mal — il ne joue pas et ne parle pas avec les autres." },
      { q: "L'usage excessif du téléphone peut-il devenir une dépendance ?", a: "Oui, il a des traits communs avec d'autres dépendances." },
      { q: "Quel type de contenu les enfants peuvent-ils trouver en ligne sans surveillance ?", a: "Du contenu violent, sexuel ou manipulateur." },
      { q: "Quel pays est mentionné dans le texte ?", a: "Le Royaume-Uni." },
      { q: "Les parents savent-ils toujours ce que regardent leurs enfants ?", a: "Non, souvent ils n'en ont aucune idée." },
      { q: "Et toi — passes-tu trop de temps sur ton téléphone ?", a: "" }
    ],
    comprehension: [
      { type:'mc', q: "Selon le texte, comment le smartphone apparaît-il à beaucoup de parents ?",
        options:["comme une punition","comme une solution parfaite","comme un danger","comme une perte de temps"], correct: 1 },
      { type:'tf', q: "Le texte affirme que la dépendance au smartphone est exactement la même que la dépendance aux drogues.", correct: false },
      { type:'mc', q: "Quel pays est mentionné dans le texte ?",
        options:["Allemagne","France","Royaume-Uni","Japon"], correct: 2 },
      { type:'open', q: "Que peuvent faire les parents pour protéger leurs enfants des contenus nocifs ?" }
    ]
  },
  translations: { pl: SMARTPHONE_PL },
  audio: { A1:null, A2:null, B1:null, B2:null, C1:null, C2:null }
}];

const SEED_DICT = [
  mk('cat','en','A1','/kæt/','noun',['kot'],
     [{sentence:"The cat is on his desk.", translationPL:"Kot jest na jego biurku."}],
     ['demo-en-strange-day'], 'complete'),
  mk('school','en','A1','/skuːl/','noun',['szkoła'],
     [{sentence:"Tom goes to school.", translationPL:"Tom idzie do szkoły."}],
     ['demo-en-strange-day'], 'complete'),
  mk('desk','en','A1','/dɛsk/','noun',['biurko','ławka'],
     [{sentence:"The cat is on his desk.", translationPL:"Kot jest na jego biurku."}],
     ['demo-en-strange-day'], 'complete'),
  mk('milk','en','A1','/mɪlk/','noun',['mleko'],
     [{sentence:"He gives the cat some milk.", translationPL:"Daje kotu trochę mleka."}],
     ['demo-en-strange-day'], 'complete'),
  mk('teacher','en','A1','/ˈtiː.tʃər/','noun',['nauczyciel','nauczycielka'],
     [{sentence:"The teacher comes in.", translationPL:"Wchodzi nauczycielka."}],
     ['demo-en-strange-day'], 'complete'),
  mk('happy','en','A1','/ˈhæp.i/','adjective',['szczęśliwy','zadowolony'],
     [{sentence:"Tom is happy.", translationPL:"Tom jest szczęśliwy."}],
     ['demo-en-strange-day'], 'complete'),
  mk('angry','en','A1','/ˈæŋ.ɡri/','adjective',['zły','wściekły'],
     [{sentence:"She is not angry.", translationPL:"Ona nie jest zła."}],
     ['demo-en-strange-day'], 'complete'),
  mk('big','en','A1','/bɪɡ/','adjective',['duży'],
     [{sentence:"His bag is big.", translationPL:"Jego torba jest duża."}],
     ['demo-en-strange-day'], 'complete'),
  mk('hot','en','A1','/hɒt/','adjective',['gorący'],
     [{sentence:"The sun is hot.", translationPL:"Słońce jest gorące."}],
     ['demo-en-strange-day'], 'complete'),
  mk('bag','en','A1','/bæɡ/','noun',['torba','plecak'],
     [{sentence:"His bag is big.", translationPL:"Jego torba jest duża."}],
     ['demo-en-strange-day'], 'complete'),
  mk('classroom','en','A2','/ˈklɑːs.ruːm/','noun',['klasa','sala lekcyjna'],
     [{sentence:"He walked into the classroom.", translationPL:"Wszedł do klasy."}],
     ['demo-en-strange-day'], 'complete'),
  mk('lunchbox','en','A2','/ˈlʌntʃ.bɒks/','noun',['pudełko śniadaniowe'],
     [{sentence:"He gave the cat some milk from his lunchbox.", translationPL:"Dał kotu trochę mleka ze swojego pudełka śniadaniowego."}],
     ['demo-en-strange-day'], 'complete'),
  mk('surprised','en','A2','/səˈpraɪzd/','adjective',['zaskoczony'],
     [{sentence:"Tom was surprised but happy.", translationPL:"Tom był zaskoczony, ale szczęśliwy."}],
     ['demo-en-strange-day'], 'complete'),
  mk('lovely','en','A2','/ˈlʌv.li/','adjective',['uroczy','śliczny'],
     [{sentence:"What a lovely cat!", translationPL:"Co za uroczy kot!"}],
     ['demo-en-strange-day'], 'complete'),
  mk('eagerly','en','B1','/ˈiː.ɡə.li/','adverb',['ochoczo','z zapałem'],
     [{sentence:"It drank the milk eagerly.", translationPL:"Pił mleko z zapałem."}],
     ['demo-en-strange-day'], 'complete'),
  mk('relief','en','B1','/rɪˈliːf/','noun',['ulga'],
     [{sentence:"To his relief, she wasn't angry.", translationPL:"Ku jego uldze, nie była zła."}],
     ['demo-en-strange-day'], 'complete'),
  mk('rummage through','en','B2','/ˈrʌm.ɪdʒ θruː/','phrase',['grzebać w','przeszukiwać'],
     [{sentence:"He rummaged through his lunchbox.", translationPL:"Przeszukiwał swoje pudełko śniadaniowe."}],
     ['demo-en-strange-day'], 'needs review'),
  mk('brace oneself','en','B2','/breɪs/','phrase',['przygotować się (na coś nieprzyjemnego)'],
     [{sentence:"He braced himself for a scolding.", translationPL:"Przygotował się na reprymendę."}],
     ['demo-en-strange-day'], 'complete'),
  mk('connoisseur','en','C1','/ˌkɒn.əˈsɜːr/','noun',['koneser','znawca'],
     [{sentence:"The cat was evidently a connoisseur of milk.", translationPL:"Kot był wyraźnie koneserem mleka."}],
     ['demo-en-strange-day'], 'complete'),
  mk('reprimand','en','C1','/ˈrep.rɪ.mɑːnd/','noun',['nagana','reprymenda'],
     [{sentence:"He braced himself for a reprimand.", translationPL:"Przygotował się na naganę."}],
     ['demo-en-strange-day'], 'needs review'),
  mk('vigilant','en','C2','/ˈvɪdʒ.ɪ.lənt/','adjective',['czujny'],
     [{sentence:"Even the most vigilant observer was lulled.", translationPL:"Nawet najczujniejszego obserwatora to uśpiło."}],
     ['demo-en-strange-day'], 'complete'),
  mk('proprietorial','en','C2','/prəˌpraɪ.ɪˈtɔː.ri.əl/','adjective',['posiadający charakter właściciela'],
     [{sentence:"It sat with a proprietorial air.", translationPL:"Siedział z miną właściciela."}],
     ['demo-en-strange-day'], 'needs review'),

  // ----- Russian -----
  mk('парк','ru','A1','/park/','noun',['park'],
     [{sentence:"Анна идёт в парк.", translationPL:"Anna idzie do parku."}],
     ['demo-ru-park'], 'complete'),
  mk('скамейка','ru','A1','/skɐˈmʲejkə/','noun',['ławka'],
     [{sentence:"Старик сидит на скамейке.", translationPL:"Starzec siedzi na ławce."}],
     ['demo-ru-park'], 'complete'),
  mk('старик','ru','A1','/stɐˈrik/','noun',['starzec','staruszek'],
     [{sentence:"В парке она видит старика.", translationPL:"W parku widzi starca."}],
     ['demo-ru-park'], 'complete'),
  mk('шляпа','ru','A1','/ˈʂlʲapə/','noun',['kapelusz'],
     [{sentence:"У него большая шляпа.", translationPL:"Ma duży kapelusz."}],
     ['demo-ru-park'], 'complete'),
  mk('книга','ru','A1','/ˈknʲiɡə/','noun',['książka'],
     [{sentence:"Он читает книгу.", translationPL:"On czyta książkę."}],
     ['demo-ru-park'], 'complete'),
  mk('яблоко','ru','A1','/ˈjabɫəkə/','noun',['jabłko'],
     [{sentence:"Он даёт Анне яблоко.", translationPL:"Daje Annie jabłko."}],
     ['demo-ru-park'], 'complete'),
  mk('суббота','ru','A1','/sʊˈbotə/','noun',['sobota'],
     [{sentence:"Сегодня суббота.", translationPL:"Dzisiaj jest sobota."}],
     ['demo-ru-park'], 'complete'),
  mk('погода','ru','A1','/pɐˈɡodə/','noun',['pogoda'],
     [{sentence:"Погода хорошая.", translationPL:"Pogoda jest dobra."}],
     ['demo-ru-park'], 'complete'),
  mk('хороший','ru','A1','/xɐˈroʂɨj/','adjective',['dobry'],
     [{sentence:"Погода хорошая.", translationPL:"Pogoda jest dobra."}],
     ['demo-ru-park'], 'complete'),
  mk('большой','ru','A1','/bɐlʲˈʂoj/','adjective',['duży'],
     [{sentence:"У него большая шляпа.", translationPL:"Ma duży kapelusz."}],
     ['demo-ru-park'], 'complete'),
  mk('улыбаться','ru','A2','/ʊɫɨˈbatʲsʲə/','verb',['uśmiechać się'],
     [{sentence:"Старик улыбается.", translationPL:"Starzec się uśmiecha."}],
     ['demo-ru-park'], 'complete'),
  mk('фонтан','ru','A2','/fɐnˈtan/','noun',['fontanna'],
     [{sentence:"Возле фонтана она увидела старика.", translationPL:"Obok fontanny zobaczyła starca."}],
     ['demo-ru-park'], 'complete'),
  mk('волшебный','ru','B1','/vɐɫˈʂɛbnɨj/','adjective',['magiczny','czarodziejski'],
     [{sentence:"Это волшебное яблоко.", translationPL:"To magiczne jabłko."}],
     ['demo-ru-park'], 'complete'),
  mk('пожилой','ru','B1','/pɐʐɨˈɫoj/','adjective',['starszy','w podeszłym wieku'],
     [{sentence:"Она заметила пожилого человека.", translationPL:"Zauważyła starszą osobę."}],
     ['demo-ru-park'], 'complete'),
  mk('заброшенный','ru','B2','/zɐˈbroʂɨn(ː)ɨj/','adjective',['zaniedbany','opuszczony'],
     [{sentence:"Возле заброшенного фонтана.", translationPL:"Obok opuszczonej fontanny."}],
     ['demo-ru-park'], 'complete'),

  // ----- German -----
  mk('Brief','de','A1','/bʁiːf/','noun',['list'],
     [{sentence:"Lukas öffnet den Brief.", translationPL:"Lukas otwiera list."}],
     ['demo-de-brief'], 'complete'),
  mk('Briefkasten','de','A1','/ˈbʁiːfˌkastn̩/','noun',['skrzynka pocztowa'],
     [{sentence:"Lukas geht zum Briefkasten.", translationPL:"Lukas idzie do skrzynki pocztowej."}],
     ['demo-de-brief'], 'complete'),
  mk('Foto','de','A1','/ˈfoːto/','noun',['zdjęcie','fotografia'],
     [{sentence:"Im Brief ist ein Foto.", translationPL:"W liście jest zdjęcie."}],
     ['demo-de-brief'], 'complete'),
  mk('Großvater','de','A1','/ˈɡʁoːsˌfaːtɐ/','noun',['dziadek'],
     [{sentence:"Das Foto ist von seinem Großvater.", translationPL:"To zdjęcie jego dziadka."}],
     ['demo-de-brief'], 'complete'),
  mk('Mutter','de','A1','/ˈmʊtɐ/','noun',['matka','mama'],
     [{sentence:"Er ruft seine Mutter.", translationPL:"Woła swoją mamę."}],
     ['demo-de-brief'], 'complete'),
  mk('Montag','de','A1','/ˈmoːntaːk/','noun',['poniedziałek'],
     [{sentence:"Es ist Montag.", translationPL:"Jest poniedziałek."}],
     ['demo-de-brief'], 'complete'),
  mk('alt','de','A1','/alt/','adjective',['stary'],
     [{sentence:"Der Brief ist alt.", translationPL:"List jest stary."}],
     ['demo-de-brief'], 'complete'),
  mk('öffnen','de','A1','/ˈœfnən/','verb',['otwierać'],
     [{sentence:"Lukas öffnet den Brief.", translationPL:"Lukas otwiera list."}],
     ['demo-de-brief'], 'complete'),
  mk('überrascht','de','A2','/yːbɐˈʁaʃt/','adjective',['zaskoczony'],
     [{sentence:"Lukas ist überrascht.", translationPL:"Lukas jest zaskoczony."}],
     ['demo-de-brief'], 'complete'),
  mk('Umschlag','de','A2','/ˈʊmʃlaːk/','noun',['koperta'],
     [{sentence:"Auf dem Umschlag stand sein Name.", translationPL:"Na kopercie było jego imię."}],
     ['demo-de-brief'], 'complete'),
  mk('Absender','de','B1','/ˈapˌzɛndɐ/','noun',['nadawca'],
     [{sentence:"Es gab keinen Absender.", translationPL:"Nie było nadawcy."}],
     ['demo-de-brief'], 'complete'),
  mk('Geheimnis','de','B1','/ɡəˈhaɪmnɪs/','noun',['tajemnica','sekret'],
     [{sentence:"Das ist ein Geheimnis.", translationPL:"To tajemnica."}],
     ['demo-de-brief'], 'complete'),
  mk('vergilbt','de','B2','/fɛɐ̯ˈɡɪlpt/','adjective',['pożółkły'],
     [{sentence:"Ein vergilbter Umschlag lag im Briefkasten.", translationPL:"W skrzynce leżała pożółkła koperta."}],
     ['demo-de-brief'], 'complete'),
  mk('Schauer','de','B2','/ˈʃaʊɐ/','noun',['dreszcz'],
     [{sentence:"Ein kalter Schauer lief ihm über den Rücken.", translationPL:"Zimny dreszcz przebiegł mu po plecach."}],
     ['demo-de-brief'], 'complete'),
  mk('orakelhaft','de','C1','/oˈʁaːkl̩haft/','adjective',['wieloznaczny','niejasny'],
     [{sentence:"Ein orakelhafter Satz stand auf der Rückseite.", translationPL:"Na odwrocie znajdowało się zagadkowe zdanie."}],
     ['demo-de-brief'], 'needs review'),

  // ----- French -----
  mk('librairie','fr','A1','/libʁɛʁi/','noun',['księgarnia'],
     [{sentence:"Elle voit une vieille librairie.", translationPL:"Widzi starą księgarnię."}],
     ['demo-fr-librairie'], 'complete'),
  mk('livre','fr','A1','/livʁ/','noun',['książka'],
     [{sentence:"Il donne un petit livre à Élise.", translationPL:"Daje Élise małą książkę."}],
     ['demo-fr-librairie'], 'complete'),
  mk('vieille','fr','A1','/vjɛj/','adjective',['stara'],
     [{sentence:"Elle voit une vieille librairie.", translationPL:"Widzi starą księgarnię."}],
     ['demo-fr-librairie'], 'complete'),
  mk('vieux','fr','A1','/vjø/','adjective',['stary'],
     [{sentence:"Un vieil homme sourit.", translationPL:"Stary mężczyzna się uśmiecha."}],
     ['demo-fr-librairie'], 'complete'),
  mk('dimanche','fr','A1','/dimɑ̃ʃ/','noun',['niedziela'],
     [{sentence:"C'est dimanche.", translationPL:"Jest niedziela."}],
     ['demo-fr-librairie'], 'complete'),
  mk('rue','fr','A1','/ʁy/','noun',['ulica'],
     [{sentence:"Élise marche dans la rue.", translationPL:"Élise idzie ulicą."}],
     ['demo-fr-librairie'], 'complete'),
  mk('porte','fr','A1','/pɔʁt/','noun',['drzwi'],
     [{sentence:"La porte est ouverte.", translationPL:"Drzwi są otwarte."}],
     ['demo-fr-librairie'], 'complete'),
  mk('ouvert','fr','A1','/uvɛʁ/','adjective',['otwarty'],
     [{sentence:"La porte est ouverte.", translationPL:"Drzwi są otwarte."}],
     ['demo-fr-librairie'], 'complete'),
  mk('rouge','fr','A1','/ʁuʒ/','adjective',['czerwony'],
     [{sentence:"Le livre est rouge.", translationPL:"Książka jest czerwona."}],
     ['demo-fr-librairie'], 'complete'),
  mk('homme','fr','A1','/ɔm/','noun',['mężczyzna','człowiek'],
     [{sentence:"Un vieil homme sourit.", translationPL:"Stary mężczyzna się uśmiecha."}],
     ['demo-fr-librairie'], 'complete'),
  mk('sourire','fr','A2','/suʁiʁ/','verb',['uśmiechać się'],
     [{sentence:"Un vieil homme sourit.", translationPL:"Stary mężczyzna się uśmiecha."}],
     ['demo-fr-librairie'], 'complete'),
  mk('offrir','fr','A2','/ɔfʁiʁ/','verb',['ofiarować','dawać'],
     [{sentence:"Il a offert un livre à Élise.", translationPL:"Ofiarował książkę Élise."}],
     ['demo-fr-librairie'], 'complete'),
  mk('lunettes','fr','A2','/lynɛt/','noun',['okulary'],
     [{sentence:"Un vieil homme aux lunettes rondes.", translationPL:"Stary mężczyzna w okrągłych okularach."}],
     ['demo-fr-librairie'], 'complete'),
  mk('comptoir','fr','B1','/kɔ̃twaʁ/','noun',['lada'],
     [{sentence:"Derrière le comptoir se tenait un vieil homme.", translationPL:"Za ladą stał stary mężczyzna."}],
     ['demo-fr-librairie'], 'complete'),
  mk('étagère','fr','A2','/etaʒɛʁ/','noun',['półka'],
     [{sentence:"Il a pris un livre sur une étagère.", translationPL:"Wziął książkę z półki."}],
     ['demo-fr-librairie'], 'complete'),
  mk('ruelle','fr','B2','/ʁɥɛl/','noun',['uliczka','zaułek'],
     [{sentence:"Elle s'engagea dans une ruelle pavée.", translationPL:"Skręciła w brukowaną uliczkę."}],
     ['demo-fr-librairie'], 'complete'),
  mk('entrebâillé','fr','C1','/ɑ̃tʁəbɑje/','adjective',['uchylony','niedomknięty'],
     [{sentence:"La porte était entrebâillée.", translationPL:"Drzwi były uchylone."}],
     ['demo-fr-librairie'], 'needs review'),

  // ===== Smartphone-trap vocabulary =====

  // ----- English -----
  mk('smartphone','en','A2','/ˈsmɑːt.fəʊn/','noun',['smartfon','telefon komórkowy'],
     [{sentence:"Many children have a smartphone.", translationPL:"Wiele dzieci ma smartfon."}],
     ['demo-en-smartphone'], 'complete'),
  mk('phone','en','A1','/fəʊn/','noun',['telefon'],
     [{sentence:"The child is on the phone all day.", translationPL:"Dziecko jest cały dzień przy telefonie."}],
     ['demo-en-smartphone'], 'complete'),
  mk('child','en','A1','/tʃaɪld/','noun',['dziecko'],
     [{sentence:"The child does not cry.", translationPL:"Dziecko nie płacze."}],
     ['demo-en-smartphone'], 'complete'),
  mk('parent','en','A1','/ˈpeə.rənt/','noun',['rodzic'],
     [{sentence:"Parents are happy.", translationPL:"Rodzice są szczęśliwi."}],
     ['demo-en-smartphone'], 'complete'),
  mk('screen','en','A2','/skriːn/','noun',['ekran'],
     [{sentence:"Children watch quietly behind a screen.", translationPL:"Dzieci oglądają w ciszy za ekranem."}],
     ['demo-en-smartphone'], 'complete'),
  mk('addiction','en','B1','/əˈdɪk.ʃən/','noun',['uzależnienie','nałóg'],
     [{sentence:"They can develop a kind of addiction.", translationPL:"Mogą rozwinąć coś w rodzaju uzależnienia."}],
     ['demo-en-smartphone'], 'complete'),
  mk('content','en','B1','/ˈkɒn.tent/','noun',['treść','zawartość'],
     [{sentence:"The internet is full of harmful content.", translationPL:"Internet jest pełen szkodliwych treści."}],
     ['demo-en-smartphone'], 'complete'),
  mk('supervision','en','B2','/ˌsuː.pəˈvɪʒ.ən/','noun',['nadzór'],
     [{sentence:"Without proper supervision, children see harmful material.", translationPL:"Bez właściwego nadzoru dzieci widzą szkodliwe materiały."}],
     ['demo-en-smartphone'], 'complete'),
  mk('teenager','en','A2','/ˈtiːnˌeɪ.dʒər/','noun',['nastolatek'],
     [{sentence:"Children and teenagers are exposed to harmful content.", translationPL:"Dzieci i nastolatki są narażone na szkodliwe treści."}],
     ['demo-en-smartphone'], 'complete'),

  // ----- Russian -----
  mk('телефон','ru','A1','/tʲɪlʲɪˈfon/','noun',['telefon'],
     [{sentence:"У детей часто есть телефон.", translationPL:"Dzieci często mają telefon."}],
     ['demo-ru-smartphone'], 'complete'),
  mk('смартфон','ru','A2','/smɐrtˈfon/','noun',['smartfon'],
     [{sentence:"У многих детей есть смартфон.", translationPL:"Wiele dzieci ma smartfon."}],
     ['demo-ru-smartphone'], 'complete'),
  mk('ребёнок','ru','A1','/rʲɪˈbʲonək/','noun',['dziecko'],
     [{sentence:"Ребёнок не плачет.", translationPL:"Dziecko nie płacze."}],
     ['demo-ru-smartphone'], 'complete'),
  mk('родители','ru','A1','/rɐˈdʲitʲɪlʲɪ/','noun',['rodzice'],
     [{sentence:"Родители рады.", translationPL:"Rodzice są zadowoleni."}],
     ['demo-ru-smartphone'], 'complete'),
  mk('экран','ru','A2','/ɛˈkran/','noun',['ekran'],
     [{sentence:"Дети молча смотрят за экраном.", translationPL:"Dzieci w ciszy patrzą w ekran."}],
     ['demo-ru-smartphone'], 'complete'),
  mk('зависимость','ru','B1','/zɐˈvʲisʲɪməsʲtʲ/','noun',['zależność','uzależnienie'],
     [{sentence:"У них может развиться зависимость.", translationPL:"Może się u nich rozwinąć uzależnienie."}],
     ['demo-ru-smartphone'], 'complete'),
  mk('подросток','ru','A2','/pɐˈdrostək/','noun',['nastolatek'],
     [{sentence:"Дети и подростки сталкиваются с вредным контентом.", translationPL:"Dzieci i nastolatki spotykają się ze szkodliwą treścią."}],
     ['demo-ru-smartphone'], 'complete'),
  mk('контент','ru','B1','/kɐnˈtɛnt/','noun',['treść','zawartość'],
     [{sentence:"В сети полно вредного контента.", translationPL:"W sieci jest pełno szkodliwych treści."}],
     ['demo-ru-smartphone'], 'complete'),

  // ----- German -----
  mk('Handy','de','A1','/ˈhɛndi/','noun',['telefon komórkowy','komórka'],
     [{sentence:"Das Kind ist den ganzen Tag am Handy.", translationPL:"Dziecko jest cały dzień przy telefonie."}],
     ['demo-de-smartphone'], 'complete'),
  mk('Smartphone','de','A2','/ˈsmaːɐ̯tfoːn/','noun',['smartfon'],
     [{sentence:"Viele Kinder haben ein Smartphone.", translationPL:"Wiele dzieci ma smartfon."}],
     ['demo-de-smartphone'], 'complete'),
  mk('Kind','de','A1','/kɪnt/','noun',['dziecko'],
     [{sentence:"Das Kind ist ruhig.", translationPL:"Dziecko jest spokojne."}],
     ['demo-de-smartphone'], 'complete'),
  mk('Eltern','de','A1','/ˈɛltɐn/','noun',['rodzice'],
     [{sentence:"Die Eltern sind froh.", translationPL:"Rodzice są zadowoleni."}],
     ['demo-de-smartphone'], 'complete'),
  mk('Bildschirm','de','A2','/ˈbɪltˌʃɪʁm/','noun',['ekran'],
     [{sentence:"Kinder schauen still hinter dem Bildschirm.", translationPL:"Dzieci w ciszy patrzą w ekran."}],
     ['demo-de-smartphone'], 'complete'),
  mk('Sucht','de','B1','/zʊxt/','noun',['nałóg','uzależnienie'],
     [{sentence:"Eine Art Abhängigkeit kann sich entwickeln.", translationPL:"Może się rozwinąć rodzaj uzależnienia."}],
     ['demo-de-smartphone'], 'complete'),
  mk('Jugendliche','de','A2','/ˈjuːɡn̩tlɪçə/','noun',['młodzież','nastolatkowie'],
     [{sentence:"Kinder und Jugendliche sehen ungeeignete Inhalte.", translationPL:"Dzieci i młodzież widzą nieodpowiednie treści."}],
     ['demo-de-smartphone'], 'complete'),
  mk('Inhalt','de','B1','/ˈɪnhalt/','noun',['treść','zawartość'],
     [{sentence:"Das Netz ist voll von schädlichen Inhalten.", translationPL:"Sieć jest pełna szkodliwych treści."}],
     ['demo-de-smartphone'], 'complete'),

  // ----- French -----
  mk('téléphone','fr','A1','/telefɔn/','noun',['telefon'],
     [{sentence:"Beaucoup d'enfants ont un téléphone.", translationPL:"Wiele dzieci ma telefon."}],
     ['demo-fr-smartphone'], 'complete'),
  mk('smartphone','fr','A2','/smaʁtfɔn/','noun',['smartfon'],
     [{sentence:"Beaucoup d'enfants ont un smartphone.", translationPL:"Wiele dzieci ma smartfon."}],
     ['demo-fr-smartphone'], 'complete'),
  mk('enfant','fr','A1','/ɑ̃fɑ̃/','noun',['dziecko'],
     [{sentence:"L'enfant ne pleure pas.", translationPL:"Dziecko nie płacze."}],
     ['demo-fr-smartphone'], 'complete'),
  mk('parents','fr','A1','/paʁɑ̃/','noun',['rodzice'],
     [{sentence:"Les parents sont contents.", translationPL:"Rodzice są zadowoleni."}],
     ['demo-fr-smartphone'], 'complete'),
  mk('écran','fr','A2','/ekʁɑ̃/','noun',['ekran'],
     [{sentence:"Les enfants regardent silencieusement derrière un écran.", translationPL:"Dzieci w ciszy patrzą za ekranem."}],
     ['demo-fr-smartphone'], 'complete'),
  mk('dépendance','fr','B1','/depɑ̃dɑ̃s/','noun',['uzależnienie','zależność'],
     [{sentence:"Ils peuvent développer une sorte de dépendance.", translationPL:"Mogą rozwinąć rodzaj uzależnienia."}],
     ['demo-fr-smartphone'], 'complete'),
  mk('adolescent','fr','A2','/adɔlesɑ̃/','noun',['nastolatek'],
     [{sentence:"Les enfants et les adolescents sont exposés à des contenus inappropriés.", translationPL:"Dzieci i nastolatki są narażone na nieodpowiednie treści."}],
     ['demo-fr-smartphone'], 'complete'),
  mk('contenu','fr','B1','/kɔ̃t(ə)ny/','noun',['treść','zawartość'],
     [{sentence:"Internet est plein de contenu nocif.", translationPL:"Internet jest pełen szkodliwych treści."}],
     ['demo-fr-smartphone'], 'complete')
];

function mk(word, lang, level, ipa, pos, plTrans, examples, sourceTextIds, status) {
  return {
    id: cryptoId(),
    word, language: lang, cefrLevel: level, ipa, partOfSpeech: pos,
    translations: { pl: plTrans, en: [] },
    examples, sourceTextIds, audio: null, status
  };
}
function cryptoId() {
  return 'd_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
}

// ---------- State ----------
const state = {
  texts: [],
  dictionary: [],
  favourites: [],   // array of dict entry IDs
  srs: {},          // dictId → { ease, interval, reps, due, last }
  encounters: {},   // dictId → number of times the word has appeared in rendered text
  stats: {
    dailyActivity: {},      // 'YYYY-MM-DD' → { wordsAdded, textsViewed, reviewsDone, encounters }
    longestStreak: 0,
    streakTier: 0           // running tier reached
  },
  settings: { language: 'en', theme: 'light', level: 'B1', currentTextId: null },
  qaType: 'tprs',
  selectedDictId: null,
};

const READY_TO_TEST_THRESHOLD = 7;  // after this many encounters, show the "ready" star
const TODAY = () => new Date().toISOString().slice(0,10);

function loadState() {
  state.texts       = readLS(LS_KEYS.TEXTS, JSON.parse(JSON.stringify(SEED_TEXTS)));
  state.dictionary  = readLS(LS_KEYS.DICT, JSON.parse(JSON.stringify(SEED_DICT)));
  state.favourites  = readLS(LS_KEYS.FAVS, []);
  state.srs         = readLS(LS_KEYS.SRS, {});
  state.encounters  = readLS(LS_KEYS.ENCOUNTERS, {});
  state.stats       = Object.assign(state.stats, readLS(LS_KEYS.STATS, {}));
  state.settings    = Object.assign(state.settings, readLS(LS_KEYS.SETTINGS, {}));

  // Merge any newer seed entries the user is missing (so seed expansions land for existing users).
  const haveTextIds = new Set(state.texts.map(t => t.id));
  SEED_TEXTS.forEach(s => {
    if (!haveTextIds.has(s.id)) {
      state.texts.push(JSON.parse(JSON.stringify(s)));
      return;
    }
    // Patch missing translations / illustrations onto existing user texts.
    const existing = state.texts.find(t => t.id === s.id);
    if (s.translations && !existing.translations) {
      existing.translations = JSON.parse(JSON.stringify(s.translations));
    } else if (s.translations && s.translations.pl && existing.translations && existing.translations.pl) {
      LEVELS.forEach(l => {
        if (s.translations.pl[l] && !existing.translations.pl[l]) {
          existing.translations.pl[l] = s.translations.pl[l];
        }
      });
    }
    if (s.illustration && !existing.illustration) existing.illustration = s.illustration;
  });
  const haveDictKeys = new Set(state.dictionary.map(e => `${e.language}:${e.word.toLowerCase()}`));
  SEED_DICT.forEach(s => {
    const k = `${s.language}:${s.word.toLowerCase()}`;
    if (!haveDictKeys.has(k)) state.dictionary.push(JSON.parse(JSON.stringify(s)));
  });

  // Initialise SRS state for any favourite that doesn't have one yet.
  state.favourites.forEach(id => { if (!state.srs[id]) state.srs[id] = freshSrs(); });
  saveState();

  if (!state.settings.currentTextId && state.texts.length) {
    const inLang = state.texts.find(t => t.language === state.settings.language);
    state.settings.currentTextId = (inLang || state.texts[0]).id;
  }
}

function saveState() {
  writeLS(LS_KEYS.TEXTS,      state.texts);
  writeLS(LS_KEYS.DICT,       state.dictionary);
  writeLS(LS_KEYS.FAVS,       state.favourites);
  writeLS(LS_KEYS.SRS,        state.srs);
  writeLS(LS_KEYS.ENCOUNTERS, state.encounters);
  writeLS(LS_KEYS.STATS,      state.stats);
  writeLS(LS_KEYS.SETTINGS,   state.settings);
}

// ----- Activity tracking helpers (Dashboard + streaks) -----
function bumpStat(key, amount = 1) {
  const d = TODAY();
  state.stats.dailyActivity[d] = state.stats.dailyActivity[d] || { wordsAdded:0, textsViewed:0, reviewsDone:0, encounters:0 };
  state.stats.dailyActivity[d][key] = (state.stats.dailyActivity[d][key] || 0) + amount;
}
function computeStreak() {
  const days = Object.keys(state.stats.dailyActivity).sort().reverse();
  if (!days.length) return 0;
  let streak = 0;
  let d = new Date();
  while (true) {
    const key = d.toISOString().slice(0,10);
    if (state.stats.dailyActivity[key] && hasActivity(state.stats.dailyActivity[key])) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (streak === 0 && key === TODAY()) {
      // Today has no activity yet — slide one day back to check yesterday.
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}
function hasActivity(day) {
  return (day.wordsAdded || 0) + (day.textsViewed || 0) + (day.reviewsDone || 0) > 0;
}

// ----- SRS (SM-2) -----
function freshSrs() {
  return { ease: 2.5, interval: 0, reps: 0, due: Date.now(), last: null };
}
// What interval *would* result from a given rating, without mutating state.
// Used to label the SRS rating buttons ("Good · 3d").
function fmtInterval(srs, quality) {
  const s = JSON.parse(JSON.stringify(srs));
  applySm2(s, quality);
  const days = s.interval;
  if (days < 1) return '<1d';
  if (days < 30) return days + 'd';
  if (days < 365) return Math.round(days/30) + 'mo';
  return Math.round(days/365) + 'y';
}

// Replace a target word inside a sentence with a blank, case-insensitively.
function blankWord(sentence, word) {
  if (!sentence || !word) return sentence;
  const re = new RegExp('\\b' + word.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&') + '\\b', 'i');
  return sentence.replace(re, '_____');
}

// quality 0..5 — Anki uses Again/Hard/Good/Easy mapped to 0/3/4/5.
function applySm2(srs, quality) {
  if (quality < 3) {
    srs.reps = 0;
    srs.interval = 1;
  } else {
    if (srs.reps === 0) srs.interval = 1;
    else if (srs.reps === 1) srs.interval = 6;
    else srs.interval = Math.round(srs.interval * srs.ease);
    srs.reps++;
  }
  srs.ease = Math.max(1.3, srs.ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  srs.last = Date.now();
  srs.due  = Date.now() + srs.interval * 86400000;
  return srs;
}
function readLS(k, fallback) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function writeLS(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

// ---------- DOM helpers ----------
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function el(tag, attrs={}, children=[]) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'dataset') Object.assign(e.dataset, attrs[k]);
    else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}

// ---------- Utility ----------
function normaliseWord(s) {
  return s.toLowerCase().replace(/^[^\p{L}\p{N}'-]+|[^\p{L}\p{N}'-]+$/gu, '');
}
function findDictEntry(word, language) {
  const w = normaliseWord(word);
  return state.dictionary.find(e => e.language === language &&
    (e.word.toLowerCase() === w || e.word.toLowerCase().split(' ').includes(w)));
}
function ensureDictEntryFor(word, language, level, sourceTextId) {
  const existing = findDictEntry(word, language);
  if (existing) {
    if (sourceTextId && !existing.sourceTextIds.includes(sourceTextId)) {
      existing.sourceTextIds.push(sourceTextId);
      saveState();
    }
    return existing;
  }
  const stub = {
    id: cryptoId(),
    word: normaliseWord(word) || word,
    language,
    cefrLevel: level || '',
    ipa: '',
    partOfSpeech: '',
    translations: { pl: [], en: [] },
    examples: [],
    sourceTextIds: sourceTextId ? [sourceTextId] : [],
    audio: null,
    status: 'needs review'
  };
  state.dictionary.push(stub);
  saveState();
  return stub;
}

// ---------- View navigation ----------
function showView(name) {
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === name));
  if (name === 'vocab') renderVocab();
  if (name === 'dictionary') renderDictionary();
  if (name === 'admin') renderAdmin();
  if (name === 'progress') renderProgress();
  if (name === 'quizzes') updateSrsDuePill();
}

// ---------- Progress dashboard ----------
function renderProgress() {
  const streak = computeStreak();
  if (streak > state.stats.longestStreak) { state.stats.longestStreak = streak; saveState(); }
  const today = state.stats.dailyActivity[TODAY()] || {};
  const dueNow = state.favourites.filter(id => state.srs[id] && state.srs[id].due <= Date.now()).length;

  $('#stStreak').textContent      = streak;
  $('#stLongest').textContent     = state.stats.longestStreak;
  $('#stFavs').textContent        = state.favourites.length;
  $('#stReviews').textContent     = today.reviewsDone || 0;
  $('#stEncounters').textContent  = today.encounters || 0;
  $('#stDue').textContent         = dueNow;
  $('#readyThreshold').textContent = READY_TO_TEST_THRESHOLD;

  // Activity chart — last 14 days as vertical bars
  const chart = $('#activityChart');
  chart.innerHTML = '';
  const days = [];
  const d = new Date();
  for (let i = 13; i >= 0; i--) {
    const dd = new Date(d); dd.setDate(d.getDate() - i);
    const key = dd.toISOString().slice(0,10);
    const a = state.stats.dailyActivity[key];
    const total = a ? ((a.wordsAdded||0) + (a.textsViewed||0) + (a.reviewsDone||0)) : 0;
    days.push({ key, label: dd.toLocaleDateString(undefined,{weekday:'short'}).slice(0,2), total });
  }
  const max = Math.max(1, ...days.map(d => d.total));
  days.forEach(day => {
    const h = Math.max(4, Math.round((day.total / max) * 100));
    const bar = el('div',{class:'activity-bar' + (day.total ? '' : ' empty'), title: `${day.key} · ${day.total} actions`}, [
      el('div',{class:'bar-fill', style:`height:${h}%`}),
      el('div',{class:'bar-label'}, day.label)
    ]);
    chart.appendChild(bar);
  });

  // "Ready to test" list — words with encounter count >= threshold
  const ready = state.dictionary
    .filter(e => (state.encounters[e.id] || 0) >= READY_TO_TEST_THRESHOLD)
    .sort((a,b) => (state.encounters[b.id]||0) - (state.encounters[a.id]||0))
    .slice(0, 12);
  const list = $('#readyList');
  list.innerHTML = '';
  if (!ready.length) {
    list.appendChild(el('p',{class:'muted'},'No words ready yet. Keep reading — they\'ll show up after you\'ve seen them several times.'));
    return;
  }
  ready.forEach(e => {
    const isFav = state.favourites.includes(e.id);
    const card = el('div',{class:'vocab-card', onclick: () => openWordProfile(e.id)},[
      el('div',{class:'vw-word'}, e.word),
      el('div',{class:'vw-trans'}, e.translations.pl.join(', ') || '—'),
      el('div',{class:'vw-meta'},[
        el('span',{class:'badge'}, '👁 ' + state.encounters[e.id]),
        el('span',{class:'badge subtle'}, e.cefrLevel || '?'),
        isFav ? el('span',{class:'badge', style:'background:rgba(255,209,102,0.25);color:var(--warn);'}, '★ saved') : el('span',{class:'badge subtle'}, 'not saved')
      ])
    ]);
    list.appendChild(card);
  });
}

// ---------- Reader ----------
function getCurrentText() {
  return state.texts.find(t => t.id === state.settings.currentTextId) || null;
}

// ---------- Browse panel (Netflix-style + chip filters) ----------
function renderBrowse() {
  renderFilterChips();
  renderBrowseBody();
}

function renderFilterChips() {
  const cont = $('#filterChips');
  if (!cont) return;
  cont.innerHTML = '';

  ['en','ru','de','fr'].forEach(code => {
    const on = browseFilters.languages.has(code);
    cont.appendChild(el('button', {
      class: 'filter-chip' + (on ? ' active' : ''),
      onclick: () => {
        on ? browseFilters.languages.delete(code) : browseFilters.languages.add(code);
        renderBrowse();
      }
    }, `${LANG_FLAG[code]} ${LANG_LABEL[code]}`));
  });

  LEVELS.forEach(lvl => {
    const on = browseFilters.levels.has(lvl);
    cont.appendChild(el('button', {
      class: 'filter-chip' + (on ? ' active' : ''),
      onclick: () => {
        on ? browseFilters.levels.delete(lvl) : browseFilters.levels.add(lvl);
        renderBrowse();
      }
    }, lvl));
  });

  cont.appendChild(el('button', {
    class: 'filter-chip' + (browseFilters.withImage ? ' active' : ''),
    onclick: () => { browseFilters.withImage = !browseFilters.withImage; renderBrowse(); }
  }, '🖼️ Z ilustracją'));

  cont.appendChild(el('button', {
    class: 'filter-chip' + (browseFilters.withPL ? ' active' : ''),
    onclick: () => { browseFilters.withPL = !browseFilters.withPL; renderBrowse(); }
  }, '🇵🇱 Z PL'));

  const anyFilter = browseFilters.languages.size || browseFilters.levels.size || browseFilters.withImage || browseFilters.withPL || browseFilters.search;
  if (anyFilter) {
    cont.appendChild(el('button', {
      class: 'filter-chip reset',
      onclick: () => {
        browseFilters.languages.clear();
        browseFilters.levels.clear();
        browseFilters.withImage = false;
        browseFilters.withPL = false;
        browseFilters.search = '';
        const inp = $('#browseSearch'); if (inp) inp.value = '';
        renderBrowse();
      }
    }, '✕ Wyczyść filtry'));
  }
}

function matchesFilters(t) {
  if (browseFilters.languages.size && !browseFilters.languages.has(t.language)) return false;
  if (browseFilters.levels.size) {
    const hasLevel = Array.from(browseFilters.levels).some(l => t.levels[l] && t.levels[l].trim());
    if (!hasLevel) return false;
  }
  if (browseFilters.withImage && !t.illustration) return false;
  if (browseFilters.withPL) {
    const pl = t.translations && t.translations.pl;
    if (!pl || !Object.values(pl).some(v => v && v.trim())) return false;
  }
  if (browseFilters.search && !t.title.toLowerCase().includes(browseFilters.search.toLowerCase())) return false;
  return true;
}

function renderBrowseBody() {
  const cont = $('#browseBody');
  if (!cont) return;
  cont.innerHTML = '';

  const anyFilter = browseFilters.languages.size || browseFilters.levels.size || browseFilters.withImage || browseFilters.withPL || browseFilters.search;

  if (anyFilter) {
    // Flat grid view when any filter is active.
    const filtered = state.texts.filter(matchesFilters);
    if (!filtered.length) {
      cont.appendChild(el('div', { class:'browse-empty' }, 'Brak tekstów pasujących do filtrów.'));
      return;
    }
    const grid = el('div', { class:'browse-grid' });
    filtered.forEach(t => grid.appendChild(renderBrowseCard(t)));
    cont.appendChild(grid);
    return;
  }

  // Default: Netflix-style rows for the user's primary language.
  const lang = state.settings.language;
  const langTexts = state.texts.filter(t => t.language === lang);
  if (!langTexts.length) {
    cont.appendChild(el('div', {class:'browse-empty'}, 'No texts in this language yet — add some via Admin → Texts.'));
    return;
  }
  const userLvl = state.settings.level;
  const idx = LEVELS.indexOf(userLvl);
  const next = LEVELS[idx + 1];
  const prev = LEVELS[idx - 1];

  const rows = [];
  const atLevel = (lvl) => langTexts.filter(t => t.levels[lvl] && t.levels[lvl].trim());

  rows.push({ title: `📍 Twój poziom (${userLvl})`, texts: atLevel(userLvl) });
  if (next) rows.push({ title: `🚀 Krok wyżej (${next})`, texts: atLevel(next) });
  if (prev) rows.push({ title: `📖 Łatwiejsze (${prev})`, texts: atLevel(prev) });
  rows.push({ title: `🌍 Wszystkie po ${LANG_LABEL[lang]}`, texts: langTexts });

  rows.forEach(row => {
    if (!row.texts.length) return;
    const wrap = el('div', { class:'browse-row' });
    wrap.appendChild(el('h3', { class:'browse-row-title' }, row.title));
    const scroll = el('div', { class:'browse-row-scroll' });
    row.texts.forEach(t => scroll.appendChild(renderBrowseCard(t)));
    wrap.appendChild(scroll);
    cont.appendChild(wrap);
  });
}

function renderBrowseCard(t) {
  // Preview at user's level if available, else the lowest level the text has.
  const userLvl = state.settings.level;
  const previewLvl = (t.levels[userLvl] && t.levels[userLvl].trim()) ? userLvl :
    LEVELS.find(l => t.levels[l] && t.levels[l].trim()) || userLvl;
  const content = t.levels[previewLvl] || '';
  const words   = content.trim().split(/\s+/).filter(Boolean).length;
  const time    = estimateReadingTime(words, previewLvl);
  const match   = computeLevelMatch(t, previewLvl);
  const excerpt = firstSentences(content, 3);

  const card = el('div', {
    class: 'browse-card',
    onclick: () => openTextForReading(t.id)
  });

  // Thumbnail (image, falls back to flag-only gradient)
  const thumb = el('div', { class:'browse-card-thumb' });
  thumb.appendChild(el('span', { class:'browse-card-flag' }, LANG_FLAG[t.language] || '📚'));
  const img = document.createElement('img');
  img.alt = '';
  img.onerror = () => { img.remove(); thumb.classList.add('no-image'); thumb.appendChild(document.createTextNode('📖')); };
  img.onload  = () => {};
  // Build candidate URLs (same logic as loadIllustration).
  const exts = ['jpg','jpeg','png','webp'];
  const candidates = [];
  if (t.illustration) candidates.push(t.illustration);
  exts.forEach(ext => candidates.push(`images/texts/${t.id}.${ext}`));
  const m = /^demo-[a-z]{2}-(.+)$/.exec(t.id);
  if (m) exts.forEach(ext => candidates.push(`images/texts/${m[1]}.${ext}`));
  let ci = 0;
  const tryNext = () => { if (ci < candidates.length) img.src = candidates[ci++]; else img.onerror(); };
  img.onerror = () => { if (ci < candidates.length) img.src = candidates[ci++]; else { img.remove(); thumb.classList.add('no-image'); thumb.appendChild(document.createTextNode('📖')); } };
  tryNext();
  thumb.appendChild(img);
  card.appendChild(thumb);

  // Body
  const body = el('div', { class:'browse-card-body' });
  body.appendChild(el('h4', { class:'browse-card-title' }, t.title));
  if (excerpt) body.appendChild(el('p', { class:'browse-card-excerpt' }, excerpt));

  const meta = el('div', { class:'browse-card-meta' });
  meta.appendChild(el('span', { class:'badge' }, previewLvl));
  meta.appendChild(el('span', { class:'badge subtle' }, `⏱ ${time} min`));
  meta.appendChild(el('span', { class:'badge subtle', title:'% słów które już znasz' }, `📚 ${match}%`));
  body.appendChild(meta);

  // Subtle match bar at the very bottom
  const bar = el('div', { class:'match-bar' });
  bar.appendChild(el('div', { class:'match-bar-fill', style:`width:${match}%` }));
  body.appendChild(bar);

  card.appendChild(body);
  return card;
}

// 80 wpm for A1/A2/B1, 130 for B2/C1/C2 (with floor of 1 min).
function estimateReadingTime(words, level) {
  const wpm = (level === 'A1' || level === 'A2' || level === 'B1') ? 80 : 130;
  return Math.max(1, Math.round(words / wpm));
}

// % of unique words in the text that are "known" — favourited or seen ≥ 3 times in any text.
function computeLevelMatch(text, level) {
  const content = (text.levels[level] || '').toLowerCase();
  if (!content) return 0;
  const tokens = content.split(/[\s.,!?;:"'()\[\]—–…\d]+/).filter(t => t.length > 1);
  const unique = new Set(tokens);
  if (!unique.size) return 0;
  const lang = text.language;
  let known = 0;
  const ENCOUNTER_KNOWN = 3;
  unique.forEach(w => {
    const e = state.dictionary.find(x => x.language === lang &&
      (x.word.toLowerCase() === w || x.word.toLowerCase().split(' ').includes(w)));
    if (e && (state.favourites.includes(e.id) || (state.encounters[e.id] || 0) >= ENCOUNTER_KNOWN)) known++;
  });
  return Math.round((known / unique.size) * 100);
}

function firstSentences(text, n) {
  if (!text) return '';
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.slice(0, n).join(' ').trim();
}

function openTextForReading(textId) {
  state.settings.currentTextId = textId;
  saveState();
  renderReader();
  const rp = $('#readingPanel');
  if (rp) { rp.hidden = false; setTimeout(() => rp.scrollIntoView({ behavior:'smooth', block:'start' }), 50); }
}

function renderReader() {
  renderBrowse();
  const t = getCurrentText();
  const readingPanel = $('#readingPanel');
  if (!t) {
    if (readingPanel) readingPanel.hidden = true;
    return;
  }
  if (readingPanel) readingPanel.hidden = false;

  $('#textTitle').textContent = t.title;
  $('#textLangBadge').textContent = `${LANG_FLAG[t.language] || ''} ${LANG_LABEL[t.language]}`;
  // level switch
  $$('#levelSwitch button').forEach(b => b.classList.toggle('active', b.dataset.level === state.settings.level));
  // body
  const content = t.levels[state.settings.level] || `(No ${state.settings.level} version yet.)`;
  renderClickableText(content, t);
  // word count + reading time + match badges
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  $('#wordCount').textContent = words + ' words';
  const tBadge = $('#readingTimeBadge');
  if (tBadge) { tBadge.textContent = '⏱ ' + estimateReadingTime(words, state.settings.level) + ' min'; tBadge.hidden = !words; }
  const mBadge = $('#levelMatchBadge');
  if (mBadge) { mBadge.textContent = '📚 ' + computeLevelMatch(t, state.settings.level) + '%'; mBadge.hidden = !words; }
  // bilingual translation
  renderBilingual(t);
  // questions
  renderQA();
  // admin audio for this level
  const audioSrc = t.audio && t.audio[state.settings.level];
  const audioEl = $('#adminAudio');
  if (audioSrc) { audioEl.src = audioSrc; audioEl.hidden = false; }
  else { audioEl.removeAttribute('src'); audioEl.hidden = true; }
  // illustration
  loadIllustration(t);
}

// Show or hide the Polish translation column next to the original text.
function renderBilingual(t) {
  const wrap   = $('#textWrap');
  const transl = $('#textTranslation');
  const on     = $('#bilingualMode').checked;
  const pl     = (t.translations && t.translations.pl && t.translations.pl[state.settings.level]) || '';
  if (on && pl) {
    transl.textContent = pl;
    transl.hidden = false;
    wrap.classList.add('bilingual');
  } else {
    transl.hidden = true;
    wrap.classList.remove('bilingual');
    if (on && !pl) {
      transl.textContent = '(No Polish translation for this level yet — add one via Admin → Texts.)';
      transl.hidden = false;
      transl.classList.add('placeholder');
    } else {
      transl.classList.remove('placeholder');
    }
  }
}

// Try a list of candidate URLs and show the first one that loads.
// Resolution order:
//   1. t.illustration (explicit override from admin)
//   2. images/texts/{id}.{jpg|jpeg|png|webp}             — per-text
//   3. images/texts/{storyKey}.{jpg|jpeg|png|webp}       — shared across languages,
//      where storyKey is the part of the ID after `demo-{lang}-`
function loadIllustration(t) {
  const fig = $('#textIllustration');
  const img = $('#textIllustrationImg');
  const exts = ['jpg','jpeg','png','webp'];
  const candidates = [];
  if (t.illustration) candidates.push(t.illustration);
  exts.forEach(ext => candidates.push(`images/texts/${t.id}.${ext}`));
  const m = /^demo-[a-z]{2}-(.+)$/.exec(t.id);
  if (m) exts.forEach(ext => candidates.push(`images/texts/${m[1]}.${ext}`));

  let idx = 0;
  fig.hidden = true;
  img.onload  = () => { fig.hidden = false; img.alt = t.title; };
  img.onerror = () => { if (idx < candidates.length) img.src = candidates[idx++]; else fig.hidden = true; };
  img.src = candidates[idx++];
}

// Word spans indexed by character position — needed for karaoke-synced TTS.
let wordSpansByChar = [];

function renderClickableText(content, textObj) {
  const body = $('#textBody');
  body.innerHTML = '';
  wordSpansByChar = [];

  const tokens = content.split(/(\s+|[.,!?;:"'()\[\]—–…])/);
  const lang = textObj.language;
  let charPos = 0;
  const seenInThisRender = new Set();

  tokens.forEach(tok => {
    if (!tok) return;
    if (/^\s+$/.test(tok) || /^[.,!?;:"'()\[\]—–…]+$/.test(tok)) {
      body.appendChild(document.createTextNode(tok));
    } else {
      const w = tok;
      const norm = normaliseWord(w);
      const dict = norm ? findDictEntry(norm, lang) : null;
      const isFav = dict && state.favourites.includes(dict.id);
      const span = el('span', {
        class: 'word' + (dict ? ' in-dict' : '') + (isFav ? ' fav' : '') + ((dict && dict.status==='needs review') ? ' hard' : ''),
        dataset: { word: norm, raw: w, charstart: charPos }
      }, w);
      body.appendChild(span);
      wordSpansByChar.push({ span, start: charPos, end: charPos + tok.length });
      // Encounter counter: count each dict word once per render.
      if (dict && !seenInThisRender.has(dict.id)) {
        state.encounters[dict.id] = (state.encounters[dict.id] || 0) + 1;
        seenInThisRender.add(dict.id);
      }
    }
    charPos += tok.length;
  });

  if (seenInThisRender.size) {
    bumpStat('textsViewed');
    bumpStat('encounters', seenInThisRender.size);
    saveState();
  }
}

// ---------- Tooltip ----------
let activeTooltipWord = null;

function showTooltip(span) {
  const norm = span.dataset.word;
  const t = getCurrentText();
  if (!t || !norm) return;
  let entry = findDictEntry(norm, t.language);
  if (!entry) {
    entry = ensureDictEntryFor(norm, t.language, state.settings.level, t.id);
    span.classList.add('in-dict','hard');
  }
  activeTooltipWord = entry;

  $('#wtWord').textContent = entry.word;
  $('#wtIpa').textContent  = entry.ipa || '';
  $('#wtPos').textContent  = entry.partOfSpeech || '';
  $('#wtTranslation').textContent = entry.translations.pl.length
    ? entry.translations.pl.join(', ')
    : '— (no translation yet)';
  $('#wtExample').textContent = entry.examples[0]
    ? entry.examples[0].sentence
    : '';
  $('#wtFav').textContent = state.favourites.includes(entry.id)
    ? '★ Remove from favourites'
    : '★ Add to favourites';

  const tt = $('#wordTooltip');
  tt.hidden = false;

  // Position above the word; flip if not enough space.
  const rect = span.getBoundingClientRect();
  const ttRect = tt.getBoundingClientRect();
  const x = window.scrollX + Math.min(
    Math.max(rect.left + rect.width/2 - ttRect.width/2, 8),
    window.innerWidth - ttRect.width - 8
  );
  let y = window.scrollY + rect.top - ttRect.height - 10;
  if (y < window.scrollY + 8) y = window.scrollY + rect.bottom + 10;
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
}

function hideTooltip() {
  $('#wordTooltip').hidden = true;
  activeTooltipWord = null;
}

document.addEventListener('click', (e) => {
  const w = e.target.closest('.word');
  if (w) {
    e.stopPropagation();
    showTooltip(w);
    return;
  }
  if (!e.target.closest('#wordTooltip')) hideTooltip();
});

// ---------- TTS ----------
const tts = {
  utter: null,
  voices: [],
  speak() {
    const t = getCurrentText();
    if (!t) return;
    speechSynthesis.cancel();
    const text = t.levels[state.settings.level] || '';
    const u = new SpeechSynthesisUtterance(text);
    const voiceId = $('#ttsVoice').value;
    const v = this.voices.find(v => v.voiceURI === voiceId);
    if (v) u.voice = v;
    u.rate  = parseFloat($('#ttsRate').value);
    u.pitch = parseFloat($('#ttsPitch').value);
    u.lang  = (v && v.lang) || langTag(t.language);

    // Karaoke: highlight word currently being spoken.
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      karaokeHighlight(e.charIndex);
    };
    u.onend = () => karaokeClear();
    u.onerror = () => karaokeClear();

    this.utter = u;
    speechSynthesis.speak(u);
  },
  speakWord(word, langCode='en') {
    if (!word) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    const v = pickPreferredVoice(langCode);
    if (v) u.voice = v;
    u.lang = (v && v.lang) || langTag(langCode);
    speechSynthesis.speak(u);
  },
  pause() { if (speechSynthesis.speaking) speechSynthesis.pause(); },
  stop()  { speechSynthesis.cancel(); karaokeClear(); }
};

// ---------- Karaoke (synced TTS highlight) ----------
let karaokePrev = null;
function karaokeHighlight(charIndex) {
  // Find the span whose [start, end) contains charIndex. Binary search the sorted list.
  const arr = wordSpansByChar;
  if (!arr.length) return;
  let lo = 0, hi = arr.length - 1, target = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (charIndex < arr[mid].start)      hi = mid - 1;
    else if (charIndex >= arr[mid].end)  lo = mid + 1;
    else { target = arr[mid]; break; }
  }
  if (!target) return;
  if (karaokePrev && karaokePrev !== target.span) karaokePrev.classList.remove('tts-active');
  target.span.classList.add('tts-active');
  karaokePrev = target.span;
  // Keep the active word visible (gentle).
  const rect = target.span.getBoundingClientRect();
  const tooHigh = rect.top < 100;
  const tooLow  = rect.bottom > window.innerHeight - 120;
  if (tooHigh || tooLow) target.span.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function karaokeClear() {
  if (karaokePrev) karaokePrev.classList.remove('tts-active');
  karaokePrev = null;
}

function langTag(code) {
  return ({ en: 'en-GB', ru: 'ru-RU', de: 'de-DE', fr: 'fr-FR' })[code] || 'en-GB';
}

// ---------- Pronunciation practice (Web Speech Recognition) ----------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const pronunciation = {
  sentences: [],
  index: 0,
  recognition: null,
  open() {
    const t = getCurrentText(); if (!t) return;
    const text = t.levels[state.settings.level] || '';
    this.sentences = splitSentences(text);
    this.index = 0;
    if (!SpeechRecognition) {
      $('#prSentence').textContent = '';
      $('#prResult').innerHTML = '<p class="muted">Your browser does not support speech recognition. Try Chrome or Edge.</p>';
    }
    $('#pronunciationModal').hidden = false;
    this.render();
  },
  close() { if (this.recognition) try { this.recognition.abort(); } catch{} $('#pronunciationModal').hidden = true; },
  render() {
    const s = this.sentences[this.index];
    $('#prProgress').textContent = `${this.index + 1} / ${this.sentences.length}`;
    $('#prSentence').textContent = s || '';
    $('#prResult').innerHTML = '';
    $('#prRecord').disabled = !s || !SpeechRecognition;
  },
  next() {
    if (this.index < this.sentences.length - 1) { this.index++; this.render(); }
  },
  listen() {
    const t = getCurrentText(); if (!t) return;
    const s = this.sentences[this.index]; if (!s) return;
    tts.speakWord(s, t.language);
  },
  record() {
    if (!SpeechRecognition) return;
    const t = getCurrentText(); if (!t) return;
    const s = this.sentences[this.index]; if (!s) return;
    if (this.recognition) try { this.recognition.abort(); } catch{}
    const rec = new SpeechRecognition();
    rec.lang = langTag(t.language);
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    $('#prRecord').textContent = '⏺ Listening...';
    $('#prRecord').disabled = true;
    $('#prResult').innerHTML = '<p class="muted">Listening — speak now.</p>';
    rec.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      this.evaluate(spoken, s);
    };
    rec.onerror = (e) => {
      $('#prResult').innerHTML = `<p style="color:var(--danger)">Error: ${e.error}</p>`;
    };
    rec.onend = () => {
      $('#prRecord').textContent = '🎤 Record';
      $('#prRecord').disabled = false;
    };
    rec.start();
    this.recognition = rec;
  },
  evaluate(spoken, target) {
    const norm = s => s.toLowerCase().replace(/[.,!?;:"'()\[\]—–…]/g,'').replace(/\s+/g,' ').trim();
    const spokenWords = norm(spoken).split(' ');
    const targetWords = norm(target).split(' ');
    let hits = 0;
    const result = targetWords.map(tw => {
      const ok = spokenWords.includes(tw);
      if (ok) hits++;
      return el('span',{ style: `padding:1px 5px;margin:1px;border-radius:5px;background:${ok ? 'rgba(6,214,160,0.20)' : 'rgba(225,29,72,0.18)'};color:${ok ? 'var(--success)' : 'var(--danger)'};` }, tw);
    });
    const pct = Math.round((hits / targetWords.length) * 100);
    const cont = $('#prResult'); cont.innerHTML = '';
    const score = el('div',{style:'font-size:1.6rem;font-weight:700;text-align:center;margin-bottom:0.6rem;'},
      pct >= 80 ? `🎉 ${pct}%` : pct >= 50 ? `👍 ${pct}%` : `🔁 ${pct}%`);
    cont.appendChild(score);
    cont.appendChild(el('div',{style:'text-align:center;font-family:var(--font-serif);font-size:1.05rem;line-height:1.8;'}, result));
    cont.appendChild(el('p',{class:'muted',style:'margin-top:0.6rem;'}, `You said: "${spoken}"`));
  }
};

function splitSentences(text) {
  return (text.match(/[^.!?]+[.!?]+/g) || [text]).map(s => s.trim()).filter(Boolean);
}

// Preferred voice per language. Per-language so dictionary 🔊 buttons also pick the right one.
const PREFERRED_VOICE_NAMES = {
  en: ['Google UK English Male', 'Microsoft Ryan', 'Daniel'], // British male preferences
  ru: ['Google русский', 'Microsoft Pavel'],
  de: ['Google Deutsch', 'Microsoft Stefan'],
  fr: ['Google français', 'Microsoft Henri']
};

function pickPreferredVoice(langCode) {
  const tag = langTag(langCode);
  const candidates = tts.voices.filter(v => v.lang.toLowerCase().startsWith(tag.slice(0,2).toLowerCase()));
  // 1) user-saved choice for this language
  const saved = (state.settings.voiceByLang || {})[langCode];
  if (saved) {
    const exact = candidates.find(v => v.voiceURI === saved) || tts.voices.find(v => v.voiceURI === saved);
    if (exact) return exact;
  }
  // 2) preferred names list
  for (const name of (PREFERRED_VOICE_NAMES[langCode] || [])) {
    const hit = candidates.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
    if (hit) return hit;
  }
  // 3) first matching language tag
  if (candidates.length) return candidates[0];
  return tts.voices[0] || null;
}

function loadVoices() {
  tts.voices = speechSynthesis.getVoices();
  const sel = $('#ttsVoice');
  const t = getCurrentText();
  const langCode = t ? t.language : state.settings.language;
  const tag = langTag(langCode);
  const filtered = tts.voices.filter(v => v.lang.toLowerCase().startsWith(tag.slice(0,2).toLowerCase()));
  const list = filtered.length ? filtered : tts.voices;
  sel.innerHTML = '';
  list.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.voiceURI;
    opt.textContent = `${v.name} (${v.lang})`;
    sel.appendChild(opt);
  });
  const preferred = pickPreferredVoice(langCode);
  if (preferred) sel.value = preferred.voiceURI;
}

// ---------- Q&A ----------
function renderQA() {
  const t = getCurrentText();
  const cont = $('#qaContainer');
  cont.innerHTML = '';
  $$('.qa-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.qtype === state.qaType));
  if (!t) return;
  const list = (t.questions && t.questions[state.qaType]) || [];
  if (!list.length) { cont.appendChild(el('p',{class:'muted'},'No questions yet.')); return; }
  list.forEach((q, i) => cont.appendChild(renderQuestion(q, i)));
}

function renderQuestion(q, idx) {
  const wrap = el('div', { class:'q-item' });
  wrap.appendChild(el('div', { class:'q-text' }, `${idx+1}. ${q.q}`));

  // TPRS and comprehension short/open: no typing. Just question text + optional reveal.
  if (state.qaType === 'tprs' || !q.type || q.type === 'short' || q.type === 'open') {
    if (q.a) {
      const btn = el('button', { class:'btn small ghost', style:'margin-top:0.4rem;', onclick: () => {
        const existing = wrap.querySelector('.q-answer');
        if (existing) { existing.remove(); btn.textContent = 'Show suggested answer'; return; }
        wrap.appendChild(el('div', { class:'q-answer' }, q.a));
        btn.textContent = 'Hide answer';
      }}, 'Show suggested answer');
      wrap.appendChild(btn);
    }
    return wrap;
  }

  if (q.type === 'mc') {
    const optWrap = el('div', { class:'q-options' });
    q.options.forEach((opt, oi) => {
      const id = `q${idx}_o${oi}`;
      const lbl = el('label', {}, [
        el('input', { type:'radio', name:`q${idx}`, value: oi, id }),
        document.createTextNode(' ' + opt)
      ]);
      optWrap.appendChild(lbl);
    });
    wrap.appendChild(optWrap);
    const btn = el('button', { class:'btn small primary', onclick: () => {
      const sel = wrap.querySelector(`input[name="q${idx}"]:checked`);
      const ans = wrap.querySelector('.q-answer');
      if (ans) ans.remove();
      if (!sel) { wrap.appendChild(el('div',{class:'q-answer'},'Select an option.')); return; }
      const ok = parseInt(sel.value,10) === q.correct;
      wrap.appendChild(el('div',{class:'q-answer'}, ok ? '✓ Correct!' : `✗ Correct: ${q.options[q.correct]}`));
    }}, 'Check');
    wrap.appendChild(btn);
    return wrap;
  }

  if (q.type === 'tf') {
    ['True','False'].forEach((label, i) => {
      const id = `q${idx}_${label}`;
      wrap.appendChild(el('label', {}, [
        el('input',{ type:'radio', name:`q${idx}`, value: i, id }),
        document.createTextNode(' ' + label)
      ]));
    });
    const btn = el('button', { class:'btn small primary', style:'margin-top:0.3rem;', onclick: () => {
      const sel = wrap.querySelector(`input[name="q${idx}"]:checked`);
      const ans = wrap.querySelector('.q-answer');
      if (ans) ans.remove();
      if (!sel) { wrap.appendChild(el('div',{class:'q-answer'},'Pick one.')); return; }
      const userVal = sel.value === '0';
      wrap.appendChild(el('div',{class:'q-answer'}, userVal === q.correct ? '✓ Correct!' : `✗ Correct: ${q.correct ? 'True':'False'}`));
    }}, 'Check');
    wrap.appendChild(btn);
    return wrap;
  }

  return wrap;
}

function matches(a,b) {
  return a.toLowerCase().replace(/[.\s!?]/g,'') === b.toLowerCase().replace(/[.\s!?]/g,'');
}

// ---------- Vocabulary view ----------
function renderVocab() {
  const list = $('#vocabList');
  list.innerHTML = '';
  const search = $('#vocabSearch').value.toLowerCase();
  const favs = state.favourites
    .map(id => state.dictionary.find(e => e.id === id))
    .filter(Boolean)
    .filter(e => e.word.toLowerCase().includes(search));
  $('#vocabCount').textContent = `${state.favourites.length} saved`;
  if (!favs.length) {
    list.appendChild(el('p',{class:'muted'},'No favourites yet. Click a word in the reader to add it.'));
    return;
  }
  favs.forEach(e => {
    const card = el('div',{class:'vocab-card'});
    card.appendChild(el('button', {
      class:'vw-remove', title:'Remove',
      onclick: () => { toggleFavourite(e.id); renderVocab(); renderReader(); }
    }, '✕'));
    card.appendChild(el('div',{class:'vw-word'}, e.word));
    card.appendChild(el('div',{class:'vw-trans'}, e.translations.pl.join(', ') || '— (no translation)'));
    const meta = el('div',{class:'vw-meta'},[
      el('span',{class:'badge'}, LANG_LABEL[e.language]),
      el('span',{class:'badge subtle'}, e.cefrLevel || '?'),
      el('span',{class:'badge subtle'}, e.partOfSpeech || '—')
    ]);
    card.appendChild(meta);
    card.addEventListener('click', (ev) => {
      if (ev.target.closest('.vw-remove')) return;
      openWordProfile(e.id);
    });
    list.appendChild(card);
  });
}

// ---------- Dictionary view ----------
function renderDictionary() {
  const list = $('#dictList');
  list.innerHTML = '';
  const search = $('#dictSearch').value.toLowerCase();
  const langF  = $('#dictLangFilter').value;
  const lvlF   = $('#dictLevelFilter').value;
  const posF   = $('#dictPosFilter').value;
  const stF    = $('#dictStatusFilter').value;

  const filtered = state.dictionary.filter(e =>
    e.word.toLowerCase().includes(search) &&
    (!langF || e.language === langF) &&
    (!lvlF  || e.cefrLevel === lvlF) &&
    (!posF  || e.partOfSpeech === posF) &&
    (!stF   || e.status === stF)
  );
  $('#dictCount').textContent = `${state.dictionary.length} entries`;
  if (!filtered.length) { list.appendChild(el('p',{class:'muted'},'No entries match.')); return; }
  filtered.sort((a,b)=>a.word.localeCompare(b.word)).forEach(e => {
    const enc = state.encounters[e.id] || 0;
    const isReady = enc >= READY_TO_TEST_THRESHOLD;
    const meta = [
      el('span',{class:'badge'}, LANG_LABEL[e.language]),
      el('span',{class:'badge subtle'}, e.cefrLevel || '?'),
      el('span',{class:'badge subtle'}, e.partOfSpeech || '—'),
      el('span',{class:'badge subtle', style: e.status==='complete' ? 'color:var(--success);' : 'color:var(--warn);' }, e.status)
    ];
    if (enc > 0) meta.push(el('span',{class:'badge subtle', title:'Times seen in texts'}, '👁 ' + enc));
    if (isReady) meta.push(el('span',{class:'badge', style:'background:rgba(255,209,102,0.25);color:var(--warn);', title:'You\'ve seen this enough times — ready to test!'}, '⭐ ready'));
    const entry = el('div', { class:'dict-entry', onclick: () => openWordProfile(e.id) }, [
      el('div', {}, [
        el('span',{class:'de-word'}, e.word),
        document.createTextNode(' '),
        el('span',{class:'de-ipa'}, e.ipa || '')
      ]),
      el('div',{class:'de-trans'}, e.translations.pl.join(', ') || '— (no translation)'),
      el('div',{class:'de-meta'}, meta)
    ]);
    list.appendChild(entry);
  });
}

// ---------- Word profile modal ----------
function openWordProfile(id) {
  state.selectedDictId = id;
  const e = state.dictionary.find(x => x.id === id);
  if (!e) return;
  $('#pmWord').textContent = e.word;
  $('#pmLang').textContent = LANG_LABEL[e.language];
  $('#pmLevel').textContent = e.cefrLevel || '?';
  $('#pmPos').textContent = e.partOfSpeech || '—';
  $('#pmStatus').textContent = e.status;
  $('#pmStatus').style.color = e.status === 'complete' ? 'var(--success)' : 'var(--warn)';
  $('#pmIpa').textContent = e.ipa || '';
  // translations
  const tCont = $('#pmTranslations');
  tCont.innerHTML = '';
  if (!e.translations.pl.length) tCont.appendChild(el('p',{class:'muted'},'No translations yet.'));
  e.translations.pl.forEach(t => tCont.appendChild(el('span',{class:'badge', style:'margin-right:4px;'}, t)));
  // examples
  const exCont = $('#pmExamples');
  exCont.innerHTML = '';
  if (!e.examples.length) exCont.appendChild(el('li',{class:'muted'},'No examples yet.'));
  e.examples.forEach(ex => {
    const li = el('li', {}, [
      el('div',{}, ex.sentence),
      el('div',{class:'muted', style:'font-size:0.85rem;'}, ex.translationPL || '')
    ]);
    exCont.appendChild(li);
  });
  // sources
  const sCont = $('#pmSources');
  sCont.innerHTML = '';
  if (!e.sourceTextIds.length) sCont.appendChild(el('li',{class:'muted'},'No source texts.'));
  e.sourceTextIds.forEach(tid => {
    const t = state.texts.find(x => x.id === tid);
    if (t) sCont.appendChild(el('li', {}, t.title));
  });
  $('#pmFav').textContent = state.favourites.includes(id) ? '★ Remove from favourites' : '★ Add to favourites';
  // show view, hide edit
  $('#pmView').hidden = false;
  $('#pmEditForm').hidden = true;
  $('#profileModal').hidden = false;
}

function closeProfile() { $('#profileModal').hidden = true; state.selectedDictId = null; }

function startEditProfile() {
  const e = state.dictionary.find(x => x.id === state.selectedDictId);
  if (!e) return;
  $('#pmEWord').value = e.word;
  $('#pmEIpa').value  = e.ipa || '';
  $('#pmEPos').value  = e.partOfSpeech || 'noun';
  $('#pmELevel').value = e.cefrLevel || 'A1';
  $('#pmETranslations').value = e.translations.pl.join(', ');
  $('#pmEStatus').value = e.status;
  // examples
  const cont = $('#pmEExamples');
  cont.innerHTML = '';
  e.examples.forEach((ex,i) => cont.appendChild(buildExampleRow(ex, i)));
  $('#pmView').hidden = true;
  $('#pmEditForm').hidden = false;
}

function buildExampleRow(ex, idx) {
  const row = el('div', { class:'ex-row' });
  const s = el('input',{ type:'text', placeholder:'Sentence', class:'input', value: ex.sentence || '' });
  const tp = el('input',{ type:'text', placeholder:'Polish translation', class:'input', value: ex.translationPL || '' });
  const rm = el('button', { type:'button', class:'btn danger small', onclick: () => row.remove() }, '✕');
  row.appendChild(s); row.appendChild(tp); row.appendChild(rm);
  row.dataset.idx = idx;
  return row;
}

function saveEditProfile(ev) {
  ev.preventDefault();
  const e = state.dictionary.find(x => x.id === state.selectedDictId);
  if (!e) return;
  e.word = $('#pmEWord').value.trim() || e.word;
  e.ipa  = $('#pmEIpa').value.trim();
  e.partOfSpeech = $('#pmEPos').value;
  e.cefrLevel = $('#pmELevel').value;
  e.translations.pl = $('#pmETranslations').value.split(',').map(s=>s.trim()).filter(Boolean);
  e.status = $('#pmEStatus').value;
  // examples
  e.examples = $$('#pmEExamples .ex-row').map(row => {
    const inputs = row.querySelectorAll('input');
    return { sentence: inputs[0].value.trim(), translationPL: inputs[1].value.trim() };
  }).filter(x => x.sentence);
  saveState();
  openWordProfile(e.id); // re-render view
  renderReader(); // refresh tooltips/words
  renderDictionary();
  renderVocab();
}

// ---------- Favourites ----------
function toggleFavourite(id) {
  const i = state.favourites.indexOf(id);
  if (i === -1) {
    state.favourites.push(id);
    if (!state.srs[id]) state.srs[id] = freshSrs();
    bumpStat('wordsAdded');
  } else {
    state.favourites.splice(i, 1);
  }
  saveState();
}

// ---------- Quizzes ----------
const quiz = {
  mode: null,
  pool: [],
  index: 0,
  setMode(mode) {
    this.mode = mode;
    $$('.quiz-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    this.pool = state.favourites.map(id => state.dictionary.find(e=>e.id===id)).filter(Boolean);
    this.index = 0;
    this.render();
    updateSrsDuePill();
  },
  render() {
    const area = $('#quizArea');
    area.innerHTML = '';
    if (!this.pool.length) {
      area.appendChild(el('p',{class:'muted'},'Add some words to favourites first.'));
      return;
    }
    if (this.mode === 'srs')        return this.renderSRS(area);
    if (this.mode === 'cloze')      return this.renderCloze(area);
    if (this.mode === 'flashcards') return this.renderFlashcards(area);
    if (this.mode === 'multiple')   return this.renderMultiple(area);
    if (this.mode === 'typing')     return this.renderTyping(area);
    if (this.mode === 'match')      return this.renderMatch(area);
  },

  // -------- SRS (SM-2) review --------
  renderSRS(area) {
    const due = this.pool
      .filter(e => state.srs[e.id] && state.srs[e.id].due <= Date.now())
      .sort((a,b) => state.srs[a.id].due - state.srs[b.id].due);
    if (!due.length) {
      const next = this.pool.map(e => state.srs[e.id]?.due).filter(Boolean).sort()[0];
      area.appendChild(el('h3', {}, '🎉 Nothing due!'));
      area.appendChild(el('p', { class:'muted' },
        next ? `Next card is due ${new Date(next).toLocaleString()}.`
             : 'Add favourites and they\'ll start showing up here.'));
      return;
    }
    const e = due[0];
    const srs = state.srs[e.id];
    area.appendChild(el('div',{class:'srs-progress muted', style:'margin-bottom:0.6rem;'},
      `${due.length} card${due.length===1?'':'s'} due · streak ${srs.reps} · ease ${srs.ease.toFixed(2)}`));

    const card = el('div',{class:'flashcard', onclick: function() { this.classList.toggle('flipped'); }},
      el('div',{class:'flashcard-inner'},[
        el('div',{class:'flashcard-face'}, e.word),
        el('div',{class:'flashcard-face back'}, e.translations.pl.join(', ') || '—')
      ])
    );
    area.appendChild(card);

    const rate = (q) => {
      applySm2(state.srs[e.id], q);
      bumpStat('reviewsDone');
      saveState();
      this.render();
    };
    const ratings = el('div',{class:'srs-ratings'},[
      el('button',{class:'btn small danger',  onclick: () => rate(0)}, ['Again', el('span',{class:'srs-hint'},'<1m')]),
      el('button',{class:'btn small',         onclick: () => rate(3)}, ['Hard',  el('span',{class:'srs-hint'}, fmtInterval(state.srs[e.id], 3))]),
      el('button',{class:'btn small primary', onclick: () => rate(4)}, ['Good',  el('span',{class:'srs-hint'}, fmtInterval(state.srs[e.id], 4))]),
      el('button',{class:'btn small',         onclick: () => rate(5), style:'background:rgba(6,214,160,0.15);color:var(--success);border-color:var(--success);'}, ['Easy', el('span',{class:'srs-hint'}, fmtInterval(state.srs[e.id], 5))])
    ]);
    area.appendChild(ratings);
    area.appendChild(el('p',{class:'muted',style:'text-align:center;margin-top:0.8rem;font-size:0.85rem;'},
      'Click the card to reveal the answer, then rate how it felt.'));
  },

  // -------- Cloze (fill-in-the-blank from dict examples) --------
  renderCloze(area) {
    // Only entries that have at least one example.
    const candidates = this.pool.filter(e => e.examples && e.examples.length);
    if (!candidates.length) {
      area.appendChild(el('p',{class:'muted'},'No example sentences in your favourite words yet. Click ★ on words that have example sentences in the dictionary.'));
      return;
    }
    const e = candidates[this.index % candidates.length];
    const ex = e.examples[0];
    const blanked = blankWord(ex.sentence, e.word);
    area.appendChild(el('h3',{}, 'Fill the gap'));
    area.appendChild(el('p',{class:'cloze-sentence', style:'font-size:1.15rem;font-family:var(--font-serif);line-height:1.7;'}, blanked));
    const inp = el('input',{type:'text', class:'input', placeholder:'type the missing word...', style:'max-width:320px;'});
    area.appendChild(inp);
    const result = el('div',{style:'margin-top:0.6rem;min-height:1.5em;'});
    area.appendChild(result);
    if (ex.translationPL) area.appendChild(el('p',{class:'muted', style:'margin-top:0.5rem;font-style:italic;'}, '💡 PL: ' + ex.translationPL));

    const check = () => {
      const u = inp.value.trim().toLowerCase();
      const target = e.word.toLowerCase();
      const ok = u === target;
      result.innerHTML = '';
      result.appendChild(el('span',{
        style: 'padding:0.4rem 0.7rem;border-radius:8px;font-weight:600;' +
               (ok ? 'background:rgba(6,214,160,0.15);color:var(--success);'
                   : 'background:rgba(225,29,72,0.15);color:var(--danger);')
      }, ok ? `✓ Correct: ${e.word}` : `✗ Correct answer: ${e.word}`));
    };
    const btn = el('button',{class:'btn primary', style:'margin-top:0.5rem;', onclick: check}, 'Check');
    area.appendChild(btn);
    area.appendChild(el('button',{class:'btn ghost', style:'margin-left:0.5rem;', onclick: ()=>this.next()}, 'Next ▶'));
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') check(); });
    setTimeout(()=>inp.focus(), 50);
  },


  renderFlashcards(area) {
    const e = this.pool[this.index];
    const card = el('div',{class:'flashcard', onclick: function() { this.classList.toggle('flipped'); }},
      el('div',{class:'flashcard-inner'},[
        el('div',{class:'flashcard-face'}, e.word),
        el('div',{class:'flashcard-face back'}, e.translations.pl.join(', ') || '—')
      ])
    );
    area.appendChild(card);
    area.appendChild(el('div',{style:'text-align:center;margin-top:1rem;display:flex;gap:0.5rem;justify-content:center;'},[
      el('button',{class:'btn',onclick:()=>this.prev()},'◀ Prev'),
      el('span',{class:'muted',style:'align-self:center;'}, `${this.index+1} / ${this.pool.length}`),
      el('button',{class:'btn primary',onclick:()=>this.next()},'Next ▶')
    ]));
  },
  renderMultiple(area) {
    const e = this.pool[this.index];
    const correct = e.translations.pl[0] || '—';
    // distractors
    const others = this.pool.filter(x => x.id !== e.id).slice(0,8)
      .map(x => x.translations.pl[0]).filter(Boolean);
    const opts = shuffle([correct, ...others.slice(0,3)]);
    area.appendChild(el('h3',{},`What does "${e.word}" mean?`));
    const optWrap = el('div',{class:'q-options'});
    opts.forEach(opt => {
      const lbl = el('label',{},[
        el('input',{type:'radio', name:'mc'}),
        document.createTextNode(' ' + opt)
      ]);
      lbl.addEventListener('click', () => {
        if (opt === correct) lbl.style.color = 'var(--success)';
        else lbl.style.color = 'var(--danger)';
      });
      optWrap.appendChild(lbl);
    });
    area.appendChild(optWrap);
    area.appendChild(el('div',{style:'margin-top:1rem;display:flex;gap:0.5rem;'},[
      el('button',{class:'btn primary', onclick: ()=> this.next()}, 'Next ▶')
    ]));
  },
  renderTyping(area) {
    const e = this.pool[this.index];
    area.appendChild(el('h3',{}, `Type the translation of: "${e.word}"`));
    const inp = el('input',{type:'text', class:'input', placeholder:'translation...'});
    area.appendChild(inp);
    const result = el('div',{class:'muted', style:'margin-top:0.5rem;'});
    area.appendChild(result);
    const btn = el('button',{class:'btn primary', style:'margin-top:0.5rem;', onclick: () => {
      const v = inp.value.trim().toLowerCase();
      const ok = e.translations.pl.some(t => t.toLowerCase() === v);
      result.textContent = ok ? '✓ Correct!' : `Suggested: ${e.translations.pl.join(', ') || '—'}`;
      result.style.color = ok ? 'var(--success)' : 'var(--warn)';
    }}, 'Check');
    area.appendChild(btn);
    area.appendChild(el('button',{class:'btn ghost', style:'margin-left:0.5rem;', onclick: ()=>this.next()}, 'Next ▶'));
  },
  renderMatch(area) {
    const subset = this.pool.slice(0, Math.min(5, this.pool.length));
    const left  = subset.map(e => ({ id: e.id, label: e.word }));
    const right = shuffle(subset.map(e => ({ id: e.id, label: e.translations.pl[0] || '—' })));
    area.appendChild(el('h3',{},'Match the pairs'));
    const wrap = el('div');
    let pendingLeft = null;
    function refresh() {
      wrap.innerHTML = '';
      left.forEach((l, i) => {
        const r = right[i];
        const pair = el('div',{class:'match-pair'});
        const lEl = el('div',{class:'match-left' + (l.matched?' matched':'') + (pendingLeft===l?' selected':''), onclick:()=>{
          if (l.matched) return;
          pendingLeft = l; refresh();
        }}, l.label);
        const rEl = el('div',{class:'match-right' + (r.matched?' matched':''), onclick:()=>{
          if (!pendingLeft || r.matched) return;
          if (pendingLeft.id === r.id) {
            pendingLeft.matched = true; r.matched = true;
          }
          pendingLeft = null;
          refresh();
        }}, r.label);
        pair.appendChild(lEl); pair.appendChild(rEl);
        wrap.appendChild(pair);
      });
    }
    refresh();
    area.appendChild(wrap);
    area.appendChild(el('button',{class:'btn primary',style:'margin-top:0.6rem;',onclick:()=>this.setMode('match')},'Restart'));
  },
  next() { this.index = (this.index + 1) % this.pool.length; this.render(); },
  prev() { this.index = (this.index - 1 + this.pool.length) % this.pool.length; this.render(); }
};
function shuffle(a) { const b=a.slice(); for (let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]];} return b; }

function updateSrsDuePill() {
  const pill = $('#srsDuePill'); if (!pill) return;
  const due = state.favourites.filter(id => state.srs[id] && state.srs[id].due <= Date.now()).length;
  if (due > 0) { pill.textContent = due; pill.hidden = false; }
  else { pill.hidden = true; }
}

// ---------- Admin panel ----------
let adminSelectedTextId = null;

function renderAdmin() {
  // populate text list
  const list = $('#adminTextList');
  list.innerHTML = '';
  state.texts.forEach(t => {
    list.appendChild(el('li', {
      class: t.id === adminSelectedTextId ? 'active' : '',
      onclick: () => { adminSelectedTextId = t.id; renderAdmin(); }
    }, `${t.title} (${t.language.toUpperCase()})`));
  });
  // form
  const t = state.texts.find(x => x.id === adminSelectedTextId);
  if (t) {
    $('#atTitle').value = t.title;
    $('#atLang').value  = t.language;
    $('#atIllustration').value = t.illustration || '';
    LEVELS.forEach(l => { $('#at'+l).value = t.levels[l] || ''; });
    const pl = (t.translations && t.translations.pl) || {};
    LEVELS.forEach(l => { $('#atPl'+l).value = pl[l] || ''; });
  }
  // audio dropdowns
  const auText = $('#auText');
  auText.innerHTML = '';
  state.texts.forEach(t => auText.appendChild(el('option',{value:t.id}, `${t.title} (${t.language})`)));
  const aqText = $('#aqText');
  aqText.innerHTML = '';
  state.texts.forEach(t => aqText.appendChild(el('option',{value:t.id}, t.title)));
  renderAdminQuestionList();
}

// Tracks which existing question is being edited (null = adding a new one).
let editingQuestion = null;  // { type: 'tprs'|'comprehension', index: number }

function qTypeLabel(type, q) {
  if (type === 'tprs') return 'TPRS';
  if (!q || !q.type) return 'short';
  return { mc:'Multiple', tf:'True/False', short:'Short', open:'Open' }[q.type] || q.type;
}

function renderAdminQuestionList() {
  const t = state.texts.find(x => x.id === $('#aqText').value);
  const cont = $('#aqList');
  cont.innerHTML = '';
  if (!t) { cont.appendChild(el('p',{class:'muted'},'Select a text above.')); return; }
  const type = $('#aqType').value;
  const list = (t.questions && t.questions[type]) || [];
  if (!list.length) {
    cont.appendChild(el('p',{class:'muted', style:'margin-top:0.4rem;'}, 'No questions yet — fill the form above and click Add.'));
    return;
  }
  list.forEach((q, i) => {
    const isEditing = editingQuestion && editingQuestion.type === type && editingQuestion.index === i;
    const row = el('div', { class: 'aq-row' + (isEditing ? ' editing' : '') });

    // Left: badge + question text + answer/options preview
    const left = el('div', { class:'aq-left' });
    left.appendChild(el('span',{class:'badge subtle aq-type-badge'}, qTypeLabel(type, q)));
    left.appendChild(el('span',{class:'aq-q'}, `${i+1}. ${q.q || '(empty)'}`));
    if (type === 'comprehension' && q.type === 'mc' && Array.isArray(q.options)) {
      const opts = q.options.map((o, oi) =>
        oi === q.correct ? `✓ ${o}` : `· ${o}`
      ).join('   ');
      left.appendChild(el('div',{class:'aq-extra muted'}, opts));
    } else if (type === 'comprehension' && q.type === 'tf') {
      left.appendChild(el('div',{class:'aq-extra muted'}, '↳ ' + (q.correct ? 'True' : 'False')));
    } else if (q.a) {
      left.appendChild(el('div',{class:'aq-extra muted'}, '↳ ' + q.a));
    }

    // Right: action buttons
    const right = el('div', { class:'aq-actions' });
    const upBtn = el('button',{class:'icon-btn', title:'Move up', onclick: () => moveQuestion(t, type, i, -1)}, '▲');
    const dnBtn = el('button',{class:'icon-btn', title:'Move down', onclick: () => moveQuestion(t, type, i, +1)}, '▼');
    if (i === 0) upBtn.disabled = true;
    if (i === list.length - 1) dnBtn.disabled = true;
    right.appendChild(upBtn);
    right.appendChild(dnBtn);
    right.appendChild(el('button',{class:'btn small', onclick: () => startEditQuestion(type, i)}, '✎ Edit'));
    right.appendChild(el('button',{class:'btn small danger', onclick: () => {
      if (!confirm(`Remove question "${q.q}"?`)) return;
      t.questions[type].splice(i, 1);
      if (editingQuestion && editingQuestion.type === type && editingQuestion.index === i) cancelEditQuestion();
      saveState(); renderAdminQuestionList(); renderQA();
    }}, 'Remove'));

    row.appendChild(left);
    row.appendChild(right);
    cont.appendChild(row);
  });
}

function moveQuestion(t, type, i, delta) {
  const arr = t.questions[type];
  const j = i + delta;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  // Keep edit pointer in sync if we just moved the edited question
  if (editingQuestion && editingQuestion.type === type) {
    if (editingQuestion.index === i) editingQuestion.index = j;
    else if (editingQuestion.index === j) editingQuestion.index = i;
  }
  saveState();
  renderAdminQuestionList();
  renderQA();
}

// Reflect category / subtype changes in which form rows are visible.
function updateAdminFormVisibility() {
  const cat = $('#aqType').value;
  const sub = $('#aqSubtype').value;
  $('#aqSubtypeRow').hidden = cat !== 'comprehension';
  // Suggested answer field: TPRS, and comprehension short/open
  $('#aqARow').hidden = !(cat === 'tprs' || (cat === 'comprehension' && (sub === 'short' || sub === 'open')));
  $('#aqMcRow').hidden = !(cat === 'comprehension' && sub === 'mc');
  $('#aqTfRow').hidden = !(cat === 'comprehension' && sub === 'tf');
}

function startEditQuestion(type, idx) {
  const t = state.texts.find(x => x.id === $('#aqText').value); if (!t) return;
  const q = t.questions[type][idx]; if (!q) return;
  editingQuestion = { type, index: idx };

  $('#aqType').value = type;
  if (type === 'comprehension' && q.type) $('#aqSubtype').value = q.type;
  $('#aqQ').value = q.q || '';
  $('#aqA').value = q.a || '';

  // Multiple-choice: pre-fill options & correct radio
  if (type === 'comprehension' && q.type === 'mc') {
    for (let i = 0; i < 4; i++) $('#aqOpt' + i).value = (q.options && q.options[i]) || '';
    document.querySelectorAll('input[name="aqCorrect"]').forEach(r => r.checked = (parseInt(r.value,10) === q.correct));
  } else {
    for (let i = 0; i < 4; i++) $('#aqOpt' + i).value = '';
    document.querySelectorAll('input[name="aqCorrect"]').forEach(r => r.checked = false);
  }
  // True/False
  if (type === 'comprehension' && q.type === 'tf') $('#aqTfCorrect').value = q.correct ? 'true' : 'false';

  $('#aqSave').textContent = `✓ Update question #${idx + 1}`;
  $('#aqCancel').hidden = false;
  updateAdminFormVisibility();
  renderAdminQuestionList();   // highlight the editing row
  $('#aqForm').scrollIntoView({ behavior:'smooth', block:'start' });
  $('#aqQ').focus();
}

function cancelEditQuestion() {
  editingQuestion = null;
  clearAdminQuestionForm();
  renderAdminQuestionList();
}

function clearAdminQuestionForm() {
  $('#aqQ').value = '';
  $('#aqA').value = '';
  for (let i = 0; i < 4; i++) $('#aqOpt' + i).value = '';
  document.querySelectorAll('input[name="aqCorrect"]').forEach(r => r.checked = false);
  $('#aqTfCorrect').value = 'true';
  $('#aqSave').textContent = '+ Add question';
  $('#aqCancel').hidden = true;
}

function saveAdminQuestion() {
  const t = state.texts.find(x => x.id === $('#aqText').value);
  if (!t) { alert('Pick a text first.'); return; }
  const cat = $('#aqType').value;
  const qText = $('#aqQ').value.trim();
  if (!qText) { alert('Question text is required.'); return; }

  let q;
  if (cat === 'tprs') {
    q = { q: qText, a: $('#aqA').value.trim() };
  } else {
    const sub = $('#aqSubtype').value;
    if (sub === 'mc') {
      const opts = [0,1,2,3].map(i => $('#aqOpt' + i).value.trim());
      // Drop trailing empties (but keep at least 2 filled options)
      while (opts.length > 2 && !opts[opts.length - 1]) opts.pop();
      if (opts.filter(Boolean).length < 2) { alert('Provide at least two options.'); return; }
      const correctRadio = document.querySelector('input[name="aqCorrect"]:checked');
      if (!correctRadio) { alert('Pick which option is the correct one.'); return; }
      const correctIdx = parseInt(correctRadio.value, 10);
      if (correctIdx >= opts.length || !opts[correctIdx]) { alert('The correct option is empty — fill it or pick another.'); return; }
      q = { type:'mc', q: qText, options: opts, correct: correctIdx };
    } else if (sub === 'tf') {
      q = { type:'tf', q: qText, correct: $('#aqTfCorrect').value === 'true' };
    } else if (sub === 'short') {
      q = { type:'short', q: qText, a: $('#aqA').value.trim() };
    } else /* open */ {
      q = { type:'open', q: qText };
    }
  }

  t.questions = t.questions || { tprs:[], comprehension:[] };
  t.questions[cat] = t.questions[cat] || [];

  if (editingQuestion && editingQuestion.type === cat && editingQuestion.index >= 0) {
    t.questions[cat][editingQuestion.index] = q;
  } else if (editingQuestion && editingQuestion.type !== cat) {
    // User switched category while editing — treat as new question, drop the old one.
    t.questions[editingQuestion.type].splice(editingQuestion.index, 1);
    t.questions[cat].push(q);
  } else {
    t.questions[cat].push(q);
  }

  saveState();
  cancelEditQuestion();
  renderAdminQuestionList();
  renderQA();
}

// ---------- Top-level event wiring ----------
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applyTheme();

  // Tabs
  $('#mainTabs').addEventListener('click', e => {
    const t = e.target.closest('.tab'); if (t) showView(t.dataset.view);
  });

  // Language select
  $('#langSelect').value = state.settings.language;
  $('#langSelect').addEventListener('change', e => {
    state.settings.language = e.target.value;
    const inLang = state.texts.find(t => t.language === state.settings.language);
    state.settings.currentTextId = inLang ? inLang.id : null;
    saveState();
    renderReader();
    loadVoices();
  });

  // Theme toggle
  $('#themeToggle').addEventListener('click', () => {
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    saveState(); applyTheme();
  });

  // Level switch
  $('#levelSwitch').addEventListener('click', e => {
    const b = e.target.closest('button[data-level]'); if (!b) return;
    state.settings.level = b.dataset.level; saveState(); renderReader();
  });

  // Browse panel search + "back to browse"
  $('#browseSearch').addEventListener('input', e => {
    browseFilters.search = e.target.value;
    renderBrowse();
  });
  $('#backToBrowse').addEventListener('click', () => {
    const bp = $('#browsePanel');
    if (bp) bp.scrollIntoView({ behavior:'smooth', block:'start' });
  });

  // TTS
  $('#ttsPlay').addEventListener('click', () => tts.speak());
  $('#ttsPause').addEventListener('click', () => tts.pause());
  $('#ttsStop').addEventListener('click', () => tts.stop());
  $('#ttsVoice').addEventListener('change', e => {
    const t = getCurrentText();
    const lang = t ? t.language : state.settings.language;
    state.settings.voiceByLang = state.settings.voiceByLang || {};
    state.settings.voiceByLang[lang] = e.target.value;
    saveState();
  });
  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = loadVoices;
    setTimeout(loadVoices, 200);
  }

  // Focus / hide translations / bilingual
  $('#focusMode').addEventListener('change', e => document.body.classList.toggle('focus-mode', e.target.checked));
  $('#hideTranslations').addEventListener('change', e => document.body.classList.toggle('hide-translations', e.target.checked));
  $('#bilingualMode').addEventListener('change', () => renderBilingual(getCurrentText() || {}));

  // Pronunciation
  $('#pronunciationBtn').addEventListener('click', () => pronunciation.open());
  $('#prClose').addEventListener('click', () => pronunciation.close());
  $('#prPlay').addEventListener('click', () => pronunciation.listen());
  $('#prRecord').addEventListener('click', () => pronunciation.record());
  $('#prNext').addEventListener('click', () => pronunciation.next());
  $('#pronunciationModal').addEventListener('click', e => {
    if (e.target.id === 'pronunciationModal') pronunciation.close();
  });

  // QA tabs
  $$('.qa-tab').forEach(t => t.addEventListener('click', () => { state.qaType = t.dataset.qtype; renderQA(); }));

  // Tooltip actions
  $('#wtFav').addEventListener('click', () => {
    if (!activeTooltipWord) return;
    toggleFavourite(activeTooltipWord.id);
    renderReader(); renderVocab();
    $('#wtFav').textContent = state.favourites.includes(activeTooltipWord.id) ? '★ Remove from favourites' : '★ Add to favourites';
  });
  $('#wtSpeak').addEventListener('click', () => {
    if (activeTooltipWord) tts.speakWord(activeTooltipWord.word, activeTooltipWord.language);
  });
  $('#wtProfile').addEventListener('click', () => {
    if (!activeTooltipWord) return;
    const id = activeTooltipWord.id;
    hideTooltip();
    showView('dictionary');
    openWordProfile(id);
  });

  // Vocab search
  $('#vocabSearch').addEventListener('input', renderVocab);

  // Dictionary filters
  ['#dictSearch','#dictLangFilter','#dictLevelFilter','#dictPosFilter','#dictStatusFilter']
    .forEach(s => $(s).addEventListener('input', renderDictionary));

  // Profile modal
  $('#pmClose').addEventListener('click', closeProfile);
  $('#profileModal').addEventListener('click', e => { if (e.target.id === 'profileModal') closeProfile(); });
  $('#pmFav').addEventListener('click', () => {
    if (!state.selectedDictId) return;
    toggleFavourite(state.selectedDictId);
    openWordProfile(state.selectedDictId);
    renderReader(); renderVocab();
  });
  $('#pmEdit').addEventListener('click', startEditProfile);
  $('#pmECancel').addEventListener('click', () => openWordProfile(state.selectedDictId));
  $('#pmEditForm').addEventListener('submit', saveEditProfile);
  $('#pmEAddExample').addEventListener('click', () => {
    $('#pmEExamples').appendChild(buildExampleRow({ sentence:'', translationPL:'' }, 99));
  });
  $('#pmSpeak').addEventListener('click', () => {
    const e = state.dictionary.find(x => x.id === state.selectedDictId);
    if (e) tts.speakWord(e.word, e.language);
  });
  $('#pmPractise').addEventListener('click', () => {
    if (!state.selectedDictId) return;
    if (!state.favourites.includes(state.selectedDictId)) toggleFavourite(state.selectedDictId);
    closeProfile();
    showView('quizzes');
    quiz.setMode('flashcards');
  });

  // Quizzes
  $$('.quiz-mode').forEach(b => b.addEventListener('click', () => quiz.setMode(b.dataset.mode)));

  // Admin tabs
  $('#adminTabs').addEventListener('click', e => {
    const t = e.target.closest('.atab'); if (!t) return;
    $$('.atab').forEach(x => x.classList.toggle('active', x === t));
    $$('.atab-pane').forEach(p => p.classList.toggle('active', p.dataset.atab === t.dataset.atab));
  });

  // Admin: new text
  $('#adminNewText').addEventListener('click', () => {
    const t = {
      id: 'txt_' + Date.now(),
      title: 'New text',
      language: state.settings.language,
      illustration: null,
      levels: { A1:'',A2:'',B1:'',B2:'',C1:'',C2:'' },
      questions: { tprs:[], comprehension:[] },
      audio: { A1:null,A2:null,B1:null,B2:null,C1:null,C2:null }
    };
    state.texts.push(t); adminSelectedTextId = t.id; saveState();
    renderAdmin(); renderReader();
  });

  // Admin: save text
  $('#adminTextForm').addEventListener('submit', e => {
    e.preventDefault();
    const t = state.texts.find(x => x.id === adminSelectedTextId);
    if (!t) return;
    t.title    = $('#atTitle').value.trim() || t.title;
    t.language = $('#atLang').value;
    t.illustration = $('#atIllustration').value.trim() || null;
    LEVELS.forEach(l => { t.levels[l] = $('#at'+l).value; });
    t.translations = t.translations || { pl: {} };
    t.translations.pl = t.translations.pl || {};
    LEVELS.forEach(l => { t.translations.pl[l] = $('#atPl'+l).value; });
    saveState(); renderAdmin(); renderReader();
    alert('Saved.');
  });
  $('#atDelete').addEventListener('click', () => {
    if (!adminSelectedTextId) return;
    if (!confirm('Delete this text?')) return;
    state.texts = state.texts.filter(t => t.id !== adminSelectedTextId);
    adminSelectedTextId = null;
    if (!state.texts.find(t=>t.id===state.settings.currentTextId)) {
      state.settings.currentTextId = state.texts[0]?.id || null;
    }
    saveState(); renderAdmin(); renderReader();
  });

  // Admin: audio upload
  $('#auFile').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    const preview = $('#auPreview');
    preview.src = url; preview.hidden = false;
    const tid = $('#auText').value;
    const lvl = $('#auLevel').value;
    const t = state.texts.find(x => x.id === tid); if (!t) return;
    t.audio[lvl] = url;
    // Persisting blob URLs across reloads doesn't work; this is for in-session preview only.
    renderReader();
  });

  // Admin: dict quick add
  $('#dictQuickAdd').addEventListener('submit', e => {
    e.preventDefault();
    const w = $('#dqWord').value.trim(); if (!w) return;
    const entry = ensureDictEntryFor(w, $('#dqLang').value, $('#dqLevel').value, null);
    entry.cefrLevel = $('#dqLevel').value;
    const tr = $('#dqPL').value.trim();
    if (tr && !entry.translations.pl.includes(tr)) entry.translations.pl.push(tr);
    if (entry.translations.pl.length) entry.status = 'complete';
    saveState();
    $('#dqWord').value=''; $('#dqPL').value='';
    renderDictionary(); renderReader();
    alert('Added.');
  });

  // Admin: questions (add / edit / reorder / remove, all types)
  $('#aqText').addEventListener('change', () => { cancelEditQuestion(); renderAdminQuestionList(); });
  $('#aqType').addEventListener('change', () => {
    // Switching category cancels an in-progress edit so we don't accidentally cross-write.
    if (editingQuestion && editingQuestion.type !== $('#aqType').value) cancelEditQuestion();
    updateAdminFormVisibility();
    renderAdminQuestionList();
  });
  $('#aqSubtype').addEventListener('change', updateAdminFormVisibility);
  $('#aqSave').addEventListener('click', saveAdminQuestion);
  $('#aqCancel').addEventListener('click', cancelEditQuestion);
  updateAdminFormVisibility();

  // Admin: settings
  $('#exportData').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({
      texts: state.texts, dictionary: state.dictionary,
      favourites: state.favourites, settings: state.settings
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'levelup-data.json'; a.click();
  });
  $('#importData').addEventListener('click', () => $('#importDataFile').click());
  $('#importDataFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (data.texts) state.texts = data.texts;
        if (data.dictionary) state.dictionary = data.dictionary;
        if (data.favourites) state.favourites = data.favourites;
        if (data.settings) Object.assign(state.settings, data.settings);
        saveState(); renderReader(); renderAdmin(); renderDictionary(); renderVocab();
        alert('Imported.');
      } catch { alert('Invalid file.'); }
    };
    r.readAsText(f);
  });
  $('#clearLocal').addEventListener('click', () => {
    if (!confirm('Clear all local data and reset to seed?')) return;
    Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k));
    location.reload();
  });

  // Reading progress bar
  document.addEventListener('scroll', updateProgressBar);
  window.addEventListener('resize', updateProgressBar);

  // Initial render
  renderReader();
  updateSrsDuePill();
});

function applyTheme() {
  document.body.dataset.theme = state.settings.theme || 'light';
  $('#themeToggle').textContent = state.settings.theme === 'dark' ? '☀' : '🌙';
}

function updateProgressBar() {
  const body = $('#textBody');
  if (!body) return;
  const r = body.getBoundingClientRect();
  const total = r.height + window.innerHeight * 0.5;
  const passed = Math.max(0, window.innerHeight - r.top);
  const pct = Math.min(100, Math.max(0, (passed / total) * 100));
  $('#readProgress').style.width = pct + '%';
}
