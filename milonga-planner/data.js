/* ============================================================
   data.js — the crate.
   A curated catalog of Golden Age recordings suitable for
   dancing, with recording years, singers and editorial
   energy ratings.

   Sources for titles / orchestras / recording years:
     - Tango Voice, "Tango DJ Fundamentals: Part 1"
       tangovoice.wordpress.com/2016/12/06/tango-dj-fundamentals-part-1...
     - Tangology 101, vals & milonga tandas
       tangology101.com/main.cfm/id/485  (and the Canaro milonga pages)

   Caveats are paraphrased from the same Tango Voice guidance
   about which recordings Buenos Aires actually dances to.
   Durations are computed approximations, not discography data.
   Energy (1-5) is editorial.
   ============================================================ */

const CATALOG = [

/* ---------- CARLOS DI SARLI ---------- */
{ t:"Corazón", o:"Carlos Di Sarli", s:"Roberto Rufino", y:1939, k:"tango", e:2 },
{ t:"Catamarca", o:"Carlos Di Sarli", s:null, y:1940, k:"tango", e:2 },
{ t:"Canta pajarito", o:"Carlos Di Sarli", s:"Roberto Rufino", y:1943, k:"tango", e:2 },
{ t:"Milonguero viejo", o:"Carlos Di Sarli", s:null, y:1944, k:"tango", e:3 },
{ t:"Tu… el cielo y tú", o:"Carlos Di Sarli", s:"Alberto Podestá", y:1944, k:"tango", e:3 },
{ t:"Tu íntimo secreto", o:"Carlos Di Sarli", s:"Jorge Durán", y:1945, k:"tango", e:3 },
{ t:"Tus labios me dirán", o:"Carlos Di Sarli", s:"Jorge Durán", y:1945, k:"tango", e:3 },
{ t:"Déjame, no quiero verte más", o:"Carlos Di Sarli", s:"Alberto Podestá", y:1947, k:"tango", e:3 },
{ t:"Domani", o:"Carlos Di Sarli", s:"Mario Pomar", y:1952, k:"tango", e:2, c:"1950s vocals — melody over rhythm, rare in Buenos Aires" },
{ t:"A la gran muñeca", o:"Carlos Di Sarli", s:null, y:1954, k:"tango", e:3 },
{ t:"Fumando espero", o:"Carlos Di Sarli", s:"Argentino Ledesma", y:1956, k:"tango", e:2, c:"1950s vocals — rare in Buenos Aires" },
{ t:"Bahía Blanca", o:"Carlos Di Sarli", s:null, y:1957, k:"tango", e:3 },

/* ---------- JUAN D'ARIENZO ---------- */
{ t:"El flete", o:"Juan D'Arienzo", s:null, y:1936, k:"tango", e:4 },
{ t:"El Cachafaz", o:"Juan D'Arienzo", s:null, y:1937, k:"tango", e:4 },
{ t:"Pensalo bien", o:"Juan D'Arienzo", s:"Alberto Echagüe", y:1938, k:"tango", e:4 },
{ t:"La bruja", o:"Juan D'Arienzo", s:"Alberto Echagüe", y:1938, k:"tango", e:5 },
{ t:"Maipo", o:"Juan D'Arienzo", s:null, y:1939, k:"tango", e:5 },
{ t:"Mandria", o:"Juan D'Arienzo", s:"Alberto Echagüe", y:1939, k:"tango", e:5 },
{ t:"Dime el amor", o:"Juan D'Arienzo", s:"Héctor Mauré", y:1941, k:"tango", e:5 },
{ t:"Mirame en la cara", o:"Juan D'Arienzo", s:"Héctor Mauré", y:1942, k:"tango", e:5 },
{ t:"Derecho viejo", o:"Juan D'Arienzo", s:null, y:1948, k:"tango", e:5, c:"late D'Arienzo — sharper and faster, rare in Buenos Aires" },

/* ---------- ANÍBAL TROILO ---------- */
{ t:"Milongueando en el 40", o:"Aníbal Troilo", s:null, y:1941, k:"tango", e:4 },
{ t:"Cachirulo", o:"Aníbal Troilo", s:null, y:1941, k:"tango", e:4 },
{ t:"Tinta roja", o:"Aníbal Troilo", s:"Francisco Fiorentino", y:1941, k:"tango", e:3 },
{ t:"Toda mi vida", o:"Aníbal Troilo", s:"Francisco Fiorentino", y:1941, k:"tango", e:3 },
{ t:"Inspiración", o:"Aníbal Troilo", s:null, y:1943, k:"tango", e:3, c:"variable tempo — read the floor first" },
{ t:"Uno", o:"Aníbal Troilo", s:"Alberto Marino", y:1943, k:"tango", e:3, c:"uneven tempo — rarely played in Buenos Aires" },
{ t:"La vi llegar", o:"Aníbal Troilo", s:"Alberto Marino", y:1944, k:"tango", e:3, c:"uneven tempo — rarely played in Buenos Aires" },
{ t:"Yuyo verde", o:"Aníbal Troilo", s:"Floreal Ruiz", y:1945, k:"tango", e:3, c:"uneven tempo — rarely played in Buenos Aires" },
{ t:"Sur", o:"Aníbal Troilo", s:"Edmundo Rivero", y:1948, k:"tango", e:4, c:"variable tempo — save it for a skilled floor" },
{ t:"El choclo", o:"Aníbal Troilo", s:"Raúl Berón", y:1952, k:"tango", e:4, c:"variable tempo — save it for a skilled floor" },

/* ---------- OSVALDO PUGLIESE ---------- */
{ t:"El arranque", o:"Osvaldo Pugliese", s:null, y:1944, k:"tango", e:4 },
{ t:"Recuerdo", o:"Osvaldo Pugliese", s:null, y:1944, k:"tango", e:4 },
{ t:"Corrientes y Esmeralda", o:"Osvaldo Pugliese", s:"Roberto Chanel", y:1944, k:"tango", e:3 },
{ t:"Rondando tu esquina", o:"Osvaldo Pugliese", s:"Roberto Chanel", y:1945, k:"tango", e:3 },
{ t:"La yumba", o:"Osvaldo Pugliese", s:null, y:1946, k:"tango", e:5 },
{ t:"El Buscapie", o:"Osvaldo Pugliese", s:null, y:1947, k:"tango", e:5 },
{ t:"Jueves", o:"Osvaldo Pugliese", s:null, y:1947, k:"tango", e:5 },
{ t:"Malandraca", o:"Osvaldo Pugliese", s:null, y:1949, k:"tango", e:5 },
{ t:"Chique", o:"Osvaldo Pugliese", s:null, y:1953, k:"tango", e:5, c:"1950s Pugliese — variable tempo, needs a skilled floor" },
{ t:"Pata ancha", o:"Osvaldo Pugliese", s:null, y:1957, k:"tango", e:5, c:"1950s Pugliese — variable tempo, needs a skilled floor" },

/* ---------- FRANCISCO CANARO ---------- */
{ t:"Charamusca", o:"Francisco Canaro", s:null, y:1934, k:"tango", e:2 },
{ t:"Poema", o:"Francisco Canaro", s:"Roberto Maida", y:1935, k:"tango", e:2 },
{ t:"Viejos tiempos", o:"Francisco Canaro", s:"Roberto Maida", y:1937, k:"tango", e:2 },
{ t:"Lo pasao pasó", o:"Francisco Canaro", s:"Ernesto Fama", y:1939, k:"tango", e:3 },
{ t:"Tormenta", o:"Francisco Canaro", s:"Ernesto Fama", y:1939, k:"tango", e:3 },
{ t:"El flete", o:"Quinteto Pirincho", s:null, y:1939, k:"tango", e:3 },
{ t:"Cuando llora la milonga", o:"Quinteto Pirincho", s:null, y:1940, k:"tango", e:3 },

/* ---------- RICARDO TANTURI ---------- */
{ t:"Comparsa criollo", o:"Ricardo Tanturi", s:null, y:1941, k:"tango", e:4 },
{ t:"Una noche de garufa", o:"Ricardo Tanturi", s:null, y:1941, k:"tango", e:3 },
{ t:"Así se baila el tango", o:"Ricardo Tanturi", s:"Alberto Castillo", y:1942, k:"tango", e:5 },
{ t:"Cómo se pianta la vida", o:"Ricardo Tanturi", s:"Alberto Castillo", y:1942, k:"tango", e:4 },
{ t:"Una emoción", o:"Ricardo Tanturi", s:"Enrique Campos", y:1943, k:"tango", e:4 },
{ t:"Oigo tu voz", o:"Ricardo Tanturi", s:"Enrique Campos", y:1943, k:"tango", e:4 },

/* ---------- RODOLFO BIAGI ---------- */
{ t:"Golgota", o:"Rodolfo Biagi", s:"Teófilo Ibáñez", y:1938, k:"tango", e:4 },
{ t:"Son cosas del bandoneón", o:"Rodolfo Biagi", s:"Andrés Falgas", y:1939, k:"tango", e:4 },
{ t:"Quejas de bandoneón", o:"Rodolfo Biagi", s:null, y:1941, k:"tango", e:4 },
{ t:"Bélgica", o:"Rodolfo Biagi", s:null, y:1942, k:"tango", e:4 },
{ t:"Indiferencia", o:"Rodolfo Biagi", s:"Jorge Ortiz", y:1942, k:"tango", e:4 },
{ t:"Seamos amigos", o:"Rodolfo Biagi", s:"Alberto Amor", y:1944, k:"tango", e:4 },
{ t:"Racing Club", o:"Rodolfo Biagi", s:null, y:1950, k:"tango", e:4 },

/* ---------- MIGUEL CALÓ ---------- */
{ t:"Dos fracasos", o:"Miguel Caló", s:"Alberto Podestá", y:1941, k:"tango", e:3 },
{ t:"Yo soy el tango", o:"Miguel Caló", s:"Alberto Podestá", y:1941, k:"tango", e:4 },
{ t:"Al compás del corazón", o:"Miguel Caló", s:"Raúl Berón", y:1942, k:"tango", e:4 },
{ t:"Tristezas de la calle Corrientes", o:"Miguel Caló", s:"Raúl Berón", y:1942, k:"tango", e:3 },
{ t:"Mi cantar", o:"Miguel Caló", s:"Jorge Ortiz", y:1943, k:"tango", e:4 },
{ t:"Cuando tallan los recuerdos", o:"Miguel Caló", s:"Raúl Iriarte", y:1943, k:"tango", e:3 },
{ t:"Saludos", o:"Miguel Caló", s:null, y:1944, k:"tango", e:3 },

/* ---------- ÁNGEL D'AGOSTINO ---------- */
{ t:"Ahora no me conoces", o:"Ángel D'Agostino", s:"Ángel Vargas", y:1941, k:"tango", e:3 },
{ t:"Gran muñeca", o:"Ángel D'Agostino", s:null, y:1943, k:"tango", e:3 },
{ t:"Rondando tu esquina", o:"Ángel D'Agostino", s:"Ángel Vargas", y:1945, k:"tango", e:3 },

/* ---------- ALFREDO DE ANGELIS ---------- */
{ t:"Marioneta", o:"Alfredo De Angelis", s:"Carlos Dante & Julio Martel", y:1943, k:"tango", e:4 },
{ t:"Por eso grito", o:"Alfredo De Angelis", s:"Carlos Dante", y:1945, k:"tango", e:4 },
{ t:"El pial", o:"Alfredo De Angelis", s:null, y:1945, k:"tango", e:4 },
{ t:"Compadrón", o:"Alfredo De Angelis", s:"Carlos Dante", y:1949, k:"tango", e:4 },
{ t:"Mi dolor", o:"Alfredo De Angelis", s:null, y:1957, k:"tango", e:5 },
{ t:"Pavadita", o:"Alfredo De Angelis", s:null, y:1958, k:"tango", e:5 },

/* ---------- PEDRO LAURENZ ---------- */
{ t:"Arrabal", o:"Pedro Laurenz", s:null, y:1937, k:"tango", e:3 },
{ t:"Amurado", o:"Pedro Laurenz", s:"Juan Carlos Casas", y:1940, k:"tango", e:3 },
{ t:"Orgullo criollo", o:"Pedro Laurenz", s:null, y:1941, k:"tango", e:3 },
{ t:"Garúa", o:"Pedro Laurenz", s:"Alberto Podestá", y:1943, k:"tango", e:3 },
{ t:"Recién", o:"Pedro Laurenz", s:"Alberto Podestá", y:1943, k:"tango", e:3 },

/* ---------- OSVALDO FRESEDO ---------- */
{ t:"Vida mía", o:"Osvaldo Fresedo", s:"Roberto Ray", y:1933, k:"tango", e:2 },
{ t:"La clavada", o:"Osvaldo Fresedo", s:null, y:1933, k:"tango", e:2 },
{ t:"Tigre viejo", o:"Osvaldo Fresedo", s:null, y:1934, k:"tango", e:2 },
{ t:"No quiero verte llorar", o:"Osvaldo Fresedo", s:"Roberto Ray", y:1937, k:"tango", e:2 },
{ t:"Más allá", o:"Osvaldo Fresedo", s:"Ricardo Ruiz", y:1939, k:"tango", e:3 },

/* ---------- LUCIO DEMARE ---------- */
{ t:"Color de rosa", o:"Lucio Demare", s:null, y:1941, k:"tango", e:3 },
{ t:"Malena", o:"Lucio Demare", s:"Juan Carlos Miranda", y:1942, k:"tango", e:3 },
{ t:"Al compás de un tango", o:"Lucio Demare", s:"Juan Carlos Miranda", y:1942, k:"tango", e:3 },
{ t:"Moneda de cobre", o:"Lucio Demare", s:"Raúl Berón", y:1943, k:"tango", e:3 },
{ t:"Solamente ella", o:"Lucio Demare", s:"Horacio Quintana", y:1944, k:"tango", e:3 },

/* ---------- ENRIQUE RODRIGUEZ ---------- */
{ t:"Florida", o:"Enrique Rodriguez", s:null, y:1941, k:"tango", e:3 },
{ t:"Llorar por una mujer", o:"Enrique Rodriguez", s:"Armando Moreno", y:1941, k:"tango", e:4 },
{ t:"Suerte loca", o:"Enrique Rodriguez", s:"Armando Moreno", y:1941, k:"tango", e:4 },
{ t:"Expresión campera", o:"Enrique Rodriguez", s:null, y:1942, k:"tango", e:3 },

/* ---------- EDGARDO DONATO / LOMUTO ---------- */
{ t:"El acomodo", o:"Edgardo Donato", s:null, y:1933, k:"tango", e:3 },
{ t:"La tablada", o:"Edgardo Donato", s:null, y:1936, k:"tango", e:3 },
{ t:"Sentimiento gaucho", o:"Francisco Lomuto", s:null, y:1942, k:"tango", e:3 },
{ t:"Catamarca", o:"Francisco Lomuto", s:null, y:1943, k:"tango", e:3 },

/* ================= VALSES ================= */

/* --- Juan D'Arienzo: the vals king (32% of BA vals plays) --- */
{ t:"Pabellón de las rosas", o:"Juan D'Arienzo", s:null, y:1935, k:"vals", e:3 },
{ t:"Orillas del Plata", o:"Juan D'Arienzo", s:null, y:1935, k:"vals", e:3 },
{ t:"Corazón de artista", o:"Juan D'Arienzo", s:null, y:1936, k:"vals", e:4 },
{ t:"Amor y celos", o:"Juan D'Arienzo", s:null, y:1936, k:"vals", e:4 },
{ t:"Una lágrima", o:"Juan D'Arienzo", s:null, y:1936, k:"vals", e:4 },
{ t:"El aeroplano", o:"Juan D'Arienzo", s:null, y:1937, k:"vals", e:4 },
{ t:"Valsecito criollo", o:"Juan D'Arienzo", s:null, y:1937, k:"vals", e:4 },
{ t:"Mentías", o:"Juan D'Arienzo", s:null, y:1937, k:"vals", e:4 },
{ t:"En tu corazón", o:"Juan D'Arienzo", s:"Alberto Echagüe", y:1938, k:"vals", e:4 },
{ t:"Ay Aurora", o:"Juan D'Arienzo", s:"Alberto Echagüe", y:1939, k:"vals", e:4 },
{ t:"La serenata de ayer", o:"Juan D'Arienzo", s:"Héctor Mauré", y:1941, k:"vals", e:5 },
{ t:"Cuatro palabras", o:"Juan D'Arienzo", s:"Héctor Mauré", y:1941, k:"vals", e:5 },

/* --- Carlos Di Sarli vals --- */
{ t:"Alma mía", o:"Carlos Di Sarli", s:"Roberto Rufino", y:1940, k:"vals", e:2 },
{ t:"Ausencia", o:"Carlos Di Sarli", s:"Agustín Volpe", y:1940, k:"vals", e:2 },
{ t:"Cortando caminos", o:"Carlos Di Sarli", s:"Roberto Rufino", y:1941, k:"vals", e:2 },
{ t:"Alzame en tus brazos", o:"Carlos Di Sarli", s:"Alberto Podestá", y:1942, k:"vals", e:3 },
{ t:"Estampa federal", o:"Carlos Di Sarli", s:"Alberto Podestá", y:1942, k:"vals", e:3 },
{ t:"Rosas de otoño", o:"Carlos Di Sarli", s:"Alberto Podestá", y:1942, k:"vals", e:3 },
{ t:"Sueño de juventud", o:"Carlos Di Sarli", s:"Jorge Durán", y:1945, k:"vals", e:3 },
{ t:"Acuérdate de mí", o:"Carlos Di Sarli", s:"Jorge Durán", y:1946, k:"vals", e:3 },

/* --- Alfredo De Angelis: the Dante & Martel waltzes --- */
{ t:"Mi novia de ayer", o:"Alfredo De Angelis", s:"Floreal Ruiz", y:1944, k:"vals", e:3 },
{ t:"Soñar y nada más", o:"Alfredo De Angelis", s:"Carlos Dante & Julio Martel", y:1944, k:"vals", e:3 },
{ t:"Pobre flor", o:"Alfredo De Angelis", s:"Carlos Dante & Julio Martel", y:1946, k:"vals", e:3 },
{ t:"Flores del alma", o:"Alfredo De Angelis", s:"Carlos Dante & Julio Martel", y:1946, k:"vals", e:3 },
{ t:"Pampa y cielo", o:"Alfredo De Angelis", s:"Carlos Dante", y:1947, k:"vals", e:3 },
{ t:"Ilusión azul", o:"Alfredo De Angelis", s:"Carlos Dante", y:1949, k:"vals", e:3 },
{ t:"No vuelvas María", o:"Alfredo De Angelis", s:"Carlos Dante & Julio Martel", y:1950, k:"vals", e:4 },

/* --- Rodolfo Biagi: energetic waltzes --- */
{ t:"El último adiós", o:"Rodolfo Biagi", s:null, y:1940, k:"vals", e:4 },
{ t:"Lágrimas y sonrisas", o:"Rodolfo Biagi", s:null, y:1941, k:"vals", e:4 },
{ t:"Pájaro herido", o:"Rodolfo Biagi", s:null, y:1941, k:"vals", e:4 },
{ t:"Paloma", o:"Rodolfo Biagi", s:null, y:1945, k:"vals", e:4 },

/* --- Ángel D'Agostino & Vargas --- */
{ t:"Qué me pasará", o:"Ángel D'Agostino", s:"Ángel Vargas", y:1941, k:"vals", e:3 },
{ t:"Esquinas porteñas", o:"Ángel D'Agostino", s:"Ángel Vargas", y:1942, k:"vals", e:3 },
{ t:"El espejo de tus ojos", o:"Ángel D'Agostino", s:"Ángel Vargas", y:1944, k:"vals", e:3 },
{ t:"Tristeza criolla", o:"Ángel D'Agostino", s:"Ángel Vargas", y:1945, k:"vals", e:3 },

/* --- Aníbal Troilo vals --- */
{ t:"Temblando", o:"Aníbal Troilo", s:"Francisco Fiorentino", y:1941, k:"vals", e:3 },
{ t:"Tu diagnóstico", o:"Aníbal Troilo", s:"Francisco Fiorentino", y:1941, k:"vals", e:3 },
{ t:"Flor de lino", o:"Aníbal Troilo", s:"Floreal Ruiz", y:1947, k:"vals", e:3 },
{ t:"Romance de barrio", o:"Aníbal Troilo", s:"Floreal Ruiz", y:1947, k:"vals", e:3 },

/* --- Francisco Canaro vals --- */
{ t:"Romántica", o:"Francisco Canaro", s:null, y:1938, k:"vals", e:3 },
{ t:"Desde el alma", o:"Francisco Canaro", s:null, y:1940, k:"vals", e:3 },
{ t:"Muchacha", o:"Francisco Canaro", s:null, y:1942, k:"vals", e:3 },
{ t:"Soñar y nada más", o:"Francisco Canaro", s:null, y:1943, k:"vals", e:3 },

/* --- others --- */
{ t:"La tapera", o:"Edgardo Donato", s:null, y:1936, k:"vals", e:3 },
{ t:"Con tus besos", o:"Edgardo Donato", s:"Horacio Lagos", y:1938, k:"vals", e:4 },
{ t:"Quién será", o:"Edgardo Donato", s:"Horacio Lagos", y:1941, k:"vals", e:4 },
{ t:"Mi romance", o:"Ricardo Tanturi", s:"Alberto Castillo", y:1941, k:"vals", e:3 },
{ t:"Recuerdo", o:"Ricardo Tanturi", s:"Alberto Castillo", y:1941, k:"vals", e:3 },
{ t:"Bajo un cielo de estrellas", o:"Miguel Caló", s:null, y:1941, k:"vals", e:3 },
{ t:"Pedacito de cielo", o:"Miguel Caló", s:null, y:1942, k:"vals", e:3 },
{ t:"Al pasar", o:"Lucio Demare", s:null, y:1943, k:"vals", e:3 },
{ t:"No nos veremos más", o:"Lucio Demare", s:null, y:1943, k:"vals", e:3 },
{ t:"Se fue", o:"Lucio Demare", s:"Raúl Berón", y:1943, k:"vals", e:3 },
{ t:"Dos corazones", o:"Lucio Demare", s:null, y:1944, k:"vals", e:3 },
{ t:"Puentecito de mi río", o:"Osvaldo Pugliese", s:null, y:1944, k:"vals", e:3 },
{ t:"Ilusión marina", o:"Osvaldo Pugliese", s:null, y:1947, k:"vals", e:3 },
{ t:"Mascarita", o:"Pedro Laurenz", s:null, y:1940, k:"vals", e:3 },
{ t:"Paisaje", o:"Pedro Laurenz", s:null, y:1943, k:"vals", e:3 },
{ t:"Con tu mirar", o:"Enrique Rodriguez", s:"Armando Moreno", y:1941, k:"vals", e:3 },
{ t:"Llora corazón", o:"Enrique Rodriguez", s:"Armando Moreno", y:1945, k:"vals", e:3 },

/* ================= MILONGAS ================= */

/* --- Canaro: the milonga orchestra (25% of BA milonga plays) --- */
{ t:"Milonga sentimental", o:"Francisco Canaro", s:null, y:1933, k:"milonga", e:2 },
{ t:"Silueta porteña", o:"Francisco Canaro", s:null, y:1936, k:"milonga", e:3 },
{ t:"Milonga de mis amores", o:"Francisco Canaro", s:null, y:1937, k:"milonga", e:3 },
{ t:"Milonga brava", o:"Francisco Canaro", s:null, y:1938, k:"milonga", e:4 },
{ t:"La milonga de Buenos Aires", o:"Francisco Canaro", s:null, y:1939, k:"milonga", e:4 },
{ t:"Soy un porteño", o:"Francisco Canaro", s:null, y:1942, k:"milonga", e:4 },

/* --- D'Arienzo milongas --- */
{ t:"Silueta porteña", o:"Juan D'Arienzo", s:null, y:1936, k:"milonga", e:3 },
{ t:"La puñalada", o:"Juan D'Arienzo", s:null, y:1937, k:"milonga", e:4 },
{ t:"Milonga vieja, milonga", o:"Juan D'Arienzo", s:null, y:1937, k:"milonga", e:4 },
{ t:"La cicatriz", o:"Juan D'Arienzo", s:null, y:1939, k:"milonga", e:4 },
{ t:"Corrales viejos", o:"Juan D'Arienzo", s:null, y:1943, k:"milonga", e:5 },

/* --- Troilo / Di Sarli / Laurenz --- */
{ t:"Mano brava", o:"Aníbal Troilo", s:null, y:1941, k:"milonga", e:4 },
{ t:"Papa Baltasar", o:"Aníbal Troilo", s:null, y:1942, k:"milonga", e:4 },
{ t:"Peña mulatta", o:"Carlos Di Sarli", s:"Roberto Rufino", y:1941, k:"milonga", e:3 },
{ t:"Yo soy de San Telmo", o:"Carlos Di Sarli", s:"Roberto Rufino", y:1943, k:"milonga", e:3 },
{ t:"Yo soy de San Telmo", o:"Pedro Laurenz", s:"Alberto Podestá", y:1943, k:"milonga", e:3 },
{ t:"Milonga de mis amores", o:"Pedro Laurenz", s:null, y:1944, k:"milonga", e:4 },

/* --- Biagi / Tanturi / Caló --- */
{ t:"Campo afuera", o:"Rodolfo Biagi", s:null, y:1939, k:"milonga", e:5 },
{ t:"Picante", o:"Rodolfo Biagi", s:null, y:1941, k:"milonga", e:5 },
{ t:"Mi morocha", o:"Ricardo Tanturi", s:null, y:1941, k:"milonga", e:3 },
{ t:"Así es la milonga", o:"Ricardo Tanturi", s:null, y:1942, k:"milonga", e:3 },
{ t:"Azabache", o:"Miguel Caló", s:null, y:1942, k:"milonga", e:3 },
{ t:"Milonga que peina canas", o:"Miguel Caló", s:null, y:1942, k:"milonga", e:3 },

/* --- Donato, D'Agostino, Rodriguez, Demare, Lomuto, Pirincho, De Angelis, Fresedo --- */
{ t:"Ella es así", o:"Edgardo Donato", s:null, y:1938, k:"milonga", e:4 },
{ t:"La milonga que faltaba", o:"Edgardo Donato", s:null, y:1938, k:"milonga", e:4 },
{ t:"Entre copa y copa", o:"Ángel D'Agostino", s:null, y:1942, k:"milonga", e:2 },
{ t:"Señores, yo soy del centro", o:"Ángel D'Agostino", s:null, y:1945, k:"milonga", e:2 },
{ t:"Chunga que sí, chunga que no", o:"Enrique Rodriguez", s:null, y:1941, k:"milonga", e:3 },
{ t:"Cuando te hablen el domingo", o:"Enrique Rodriguez", s:null, y:1945, k:"milonga", e:3 },
{ t:"La esquina", o:"Lucio Demare", s:null, y:1938, k:"milonga", e:3 },
{ t:"No hay tierra como la mía", o:"Francisco Lomuto", s:null, y:1939, k:"milonga", e:4 },
{ t:"Parque Patricios", o:"Francisco Lomuto", s:null, y:1941, k:"milonga", e:4 },
{ t:"Arrabalera", o:"Quinteto Pirincho", s:null, y:1950, k:"milonga", e:4 },
{ t:"El torito", o:"Quinteto Pirincho", s:null, y:1950, k:"milonga", e:4 },
{ t:"El otario", o:"Alfredo De Angelis", s:null, y:1950, k:"milonga", e:4 },
{ t:"La trampera", o:"Osvaldo Fresedo", s:null, y:1951, k:"milonga", e:3 },
{ t:"De pura cepa", o:"Osvaldo Fresedo", s:null, y:1953, k:"milonga", e:3 }
];

/* Non-tango "curtains" — the cortina pool. Deliberately NOT tango:
   everyone must recognise that the tanda has ended. */
const CORTINAS = [
  { t:"Bésame mucho", by:"Consuelo Velázquez" },
  { t:"Sabor a mí", by:"Álvaro Carrillo" },
  { t:"Quizás, quizás, quizás", by:"Osvaldo Farrés" },
  { t:"Perfidia", by:"Alberto Domínguez" },
  { t:"Piel canela", by:"Bobby Capó" },
  { t:"Historia de un amor", by:"Carlos Eleta Almarán" },
  { t:"Solamente una vez", by:"Agustín Lara" },
  { t:"Sway (Quién será)", by:"Pablo Beltrán Ruiz" },
  { t:"You Always Hurt the One You Love", by:"The Mills Brothers" },
  { t:"Amapola", by:"José La Turba / Agustín Lara" }
];

/* The grammar of a tanda, straight from the sources:
   4 tangos · 3-4 valses · 3 milongas, ~10-12 minutes. */
const STYLE_META = {
  tango:   { label:"Tango",   need:4, max:4, min:3 },
  vals:    { label:"Vals",    need:3, max:4, min:3 },
  milonga: { label:"Milonga", need:3, max:3, min:3 }
};

/* Which orchestras the composer reaches for, per style, in rough
   order of how often Buenos Aires plays them (2008 survey + DJ
   preference surveys quoted in Tango Voice). */
const ORCH_ORDER = {
  tango:   ["Juan D'Arienzo","Carlos Di Sarli","Aníbal Troilo","Osvaldo Pugliese",
            "Ricardo Tanturi","Rodolfo Biagi","Miguel Caló","Ángel D'Agostino",
            "Alfredo De Angelis","Pedro Laurenz","Lucio Demare","Enrique Rodriguez",
            "Francisco Canaro","Osvaldo Fresedo","Edgardo Donato","Francisco Lomuto"],
  vals:    ["Juan D'Arienzo","Rodolfo Biagi","Carlos Di Sarli","Alfredo De Angelis",
            "Aníbal Troilo","Ángel D'Agostino","Francisco Canaro","Edgardo Donato",
            "Lucio Demare","Miguel Caló","Ricardo Tanturi","Enrique Rodriguez",
            "Pedro Laurenz","Osvaldo Pugliese"],
  milonga: ["Francisco Canaro","Juan D'Arienzo","Edgardo Donato","Carlos Di Sarli",
            "Aníbal Troilo","Rodolfo Biagi","Ricardo Tanturi","Miguel Caló",
            "Pedro Laurenz","Enrique Rodriguez","Francisco Lomuto","Ángel D'Agostino",
            "Lucio Demare","Alfredo De Angelis","Osvaldo Fresedo","Quinteto Pirincho"]
};

/* The classic night shape used by the composer. */
const NIGHT_PATTERN = ["tango","tango","milonga","tango","tango","vals","tango","tango","vals","tango"];
const NIGHT_ENERGY  = [2.4, 3.0, 3.3, 3.7, 4.1, 3.9, 4.5, 5.0, 4.6, 5.0];

/* Stable ids: orchestra + title, so saved nights survive edits. */
const slug = (x) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
CATALOG.forEach((x) => { x.id = slug(x.o) + "~" + slug(x.t); });

const BY_ID = Object.fromEntries(CATALOG.map((x) => [x.id, x]));
