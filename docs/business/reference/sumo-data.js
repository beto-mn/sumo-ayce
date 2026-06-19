/* ============================================================
   SUMO — Datos compartidos (fuente única para las 4 direcciones)
   Sucursales (AYCE / Express), menús por tipo y modalidad, bebidas, i18n ES/EN.
   ============================================================ */
window.SUMO = (function () {
  const A = "assets/dishes/", B = "assets/brand/", P = "assets/posters/";

  /* ---------- Sucursales (teléfonos reales) + tipo ---------- */
  // type: 'ayce' (buffet + a la carta) | 'express' (buffet)
  const branches = [
    { id:"copilco", type:"ayce", name:"Copilco", zone:"CDMX · Coyoacán", addr:"Copilco, Coyoacán, Ciudad de México", phone:"461 144 2665", lat:19.3370522, lng:-99.183458, hours:[13,23] },
    { id:"buenavista", type:"express", name:"Buenavista", zone:"CDMX · Cuauhtémoc", addr:"Buenavista, Cuauhtémoc, Ciudad de México", phone:"461 144 2665", lat:19.4489255, lng:-99.1519094, hours:[13,23] },
    { id:"etram-toreo", type:"ayce", name:"Etram Toreo", zone:"Edomex · Naucalpan de Juárez", addr:"Etram Toreo, Naucalpan de Juárez, Estado de México", phone:"461 144 2665", lat:19.457046, lng:-99.2156256, hours:[13,23] },
    { id:"tecnologico-metepec", type:"ayce", name:"Tecnológico (Metepec)", zone:"Edomex · Metepec", addr:"Metepec, Estado de México", phone:"461 144 2665", lat:19.2629286, lng:-99.5772186, hours:[13,23] },
    { id:"claveria", type:"ayce", name:"Clavería", zone:"CDMX · Azcapotzalco", addr:"Clavería, Azcapotzalco, Ciudad de México", phone:"461 144 2665", lat:19.477989, lng:-99.1883868, hours:[13,23] },
    { id:"tepozan", type:"ayce", name:"Tepozan", zone:"Edomex · Chalco", addr:"Plaza Centro Tepozán, Chalco, Estado de México", phone:"461 144 2665", lat:19.3637221, lng:-98.9893946, hours:[13,23] },
    { id:"arboledas", type:"ayce", name:"Arboledas", zone:"Edomex · Tlalnepantla de Baz", addr:"Fracc. Arboledas, Tlalnepantla de Baz, Estado de México", phone:"461 144 2665", lat:19.5554381, lng:-99.2128915, hours:[13,23] },
    { id:"bellas-artes", type:"ayce", name:"Bellas Artes", zone:"CDMX · Cuauhtémoc", addr:"Centro Histórico, Cuauhtémoc, Ciudad de México", phone:"461 144 2665", lat:19.4348474, lng:-99.1466855, hours:[13,23] },
    { id:"echegaray", type:"ayce", name:"Echegaray", zone:"Edomex · Naucalpan de Juárez", addr:"Echegaray, Naucalpan de Juárez, Estado de México", phone:"461 144 2665", lat:19.4916382, lng:-99.2279431, hours:[13,23] },
    { id:"santa-monica", type:"ayce", name:"Santa Mónica", zone:"Edomex · Tlalnepantla de Baz", addr:"Santa Mónica, Tlalnepantla de Baz, Estado de México", phone:"461 144 2665", lat:19.5345853, lng:-99.2265039, hours:[13,23] },
    { id:"plaza-coacalco", type:"ayce", name:"Plaza Coacalco", zone:"Edomex · Coacalco de Berriozábal", addr:"Plaza Coacalco, Coacalco de Berriozábal, Estado de México", phone:"461 144 2665", lat:19.6265757, lng:-99.0821527, hours:[13,23] },
    { id:"miramontes", type:"ayce", name:"Miramontes", zone:"CDMX · Tlalpan", addr:"Miramontes, Tlalpan, Ciudad de México", phone:"461 144 2665", lat:19.3058477, lng:-99.1247935, hours:[13,23] },
    { id:"bosques-del-lago", type:"ayce", name:"Bosques Del Lago", zone:"Edomex · Cuautitlán Izcalli", addr:"Bosques del Lago, Cuautitlán Izcalli, Estado de México", phone:"461 144 2665", lat:19.6119437, lng:-99.2422141, hours:[13,23] },
    { id:"perinorte", type:"ayce", name:"Perinorte", zone:"Edomex · Tlalnepantla de Baz", addr:"Plaza Perinorte, Tlalnepantla de Baz, Estado de México", phone:"461 144 2665", lat:19.6024463, lng:-99.192938, hours:[13,23] },
    { id:"encuentro-fortuna", type:"ayce", name:"Encuentro Fortuna", zone:"CDMX · Gustavo A. Madero", addr:"Lindavista, Gustavo A. Madero, Ciudad de México", phone:"461 144 2665", lat:19.4830228, lng:-99.1330672, hours:[13,23] },
    { id:"satelite", type:"ayce", name:"Satélite", zone:"Edomex · Naucalpan de Juárez", addr:"Ciudad Satélite, Naucalpan de Juárez, Estado de México", phone:"461 144 2665", lat:19.5141177, lng:-99.2309139, hours:[13,23] },
    { id:"san-cosme", type:"ayce", name:"San Cosme", zone:"CDMX · Cuauhtémoc", addr:"Santa María la Ribera, Cuauhtémoc, Ciudad de México", phone:"461 144 2665", lat:19.4385356, lng:-99.1509123, hours:[13,23] },
    { id:"valle-de-chalco", type:"ayce", name:"Valle De Chalco", zone:"Edomex · Valle de Chalco Solidaridad", addr:"Patio Valle de Chalco, Valle de Chalco Solidaridad, Estado de México", phone:"461 144 2665", lat:19.2996692, lng:-98.9533106, hours:[13,23] },
    { id:"portal-centro", type:"express", name:"Portal Centro", zone:"CDMX · Venustiano Carranza", addr:"Portal Centro, Venustiano Carranza, Ciudad de México", phone:"461 144 2665", lat:19.4193939, lng:-99.1300091, hours:[13,23] },
    { id:"carranza-toluca", type:"ayce", name:"Carranza (Toluca)", zone:"Edomex · Toluca de Lerdo", addr:"Venustiano Carranza, Toluca de Lerdo, Estado de México", phone:"461 144 2665", lat:19.2796792, lng:-99.6615446, hours:[13,23] },
    { id:"taxquena", type:"ayce", name:"Taxqueña", zone:"CDMX · Coyoacán", addr:"Taxqueña, Coyoacán, Ciudad de México", phone:"461 144 2665", lat:19.3406456, lng:-99.1333419, hours:[13,23] },
    { id:"picacho", type:"ayce", name:"Picacho", zone:"CDMX · Tlalpan", addr:"Pedregal de San Nicolás, Tlalpan, Ciudad de México", phone:"461 144 2665", lat:19.2856371, lng:-99.2181888, hours:[13,23] },
    { id:"izcalli", type:"ayce", name:"Izcalli", zone:"Edomex · Cuautitlán Izcalli", addr:"Ciudad Jardín Izcalli, Cuautitlán Izcalli, Estado de México", phone:"461 144 2665", lat:19.6610952, lng:-99.2080123, hours:[13,23] },
    { id:"insurgentes-sur", type:"ayce", name:"Insurgentes Sur", zone:"CDMX · Coyoacán", addr:"Insurgentes Sur, Coyoacán, Ciudad de México", phone:"461 144 2665", lat:19.3610568, lng:-99.1828986, hours:[13,23] },
    { id:"coyoacan", type:"ayce", name:"Coyoacán", zone:"CDMX · Coyoacán", addr:"Coyoacán, Ciudad de México", phone:"461 144 2665", lat:19.3471019, lng:-99.163545, hours:[13,23] },
    { id:"bosques-de-aragon", type:"ayce", name:"Bosques De Aragón", zone:"CDMX · Venustiano Carranza", addr:"Bosques de Aragón, Venustiano Carranza, Ciudad de México", phone:"461 144 2665", lat:19.4684659, lng:-99.0558699, hours:[13,23] },
    { id:"cuernavaca", type:"ayce", name:"Cuernavaca", zone:"Morelos · Cuernavaca", addr:"Cuernavaca, Morelos", phone:"461 144 2665", lat:18.9550507, lng:-99.2372206, hours:[13,23] },
    { id:"tezontle", type:"ayce", name:"Tezontle", zone:"CDMX · Iztapalapa", addr:"Plaza Tezontle, Iztapalapa, Ciudad de México", phone:"461 144 2665", lat:19.3816576, lng:-99.0837774, hours:[13,23] },
    { id:"napoles", type:"ayce", name:"Nápoles", zone:"CDMX · Benito Juárez", addr:"Nápoles, Benito Juárez, Ciudad de México", phone:"461 144 2665", lat:19.3975771, lng:-99.1714461, hours:[13,23] }
  ];

  /* ---------- Categorías de menú (i18n) ---------- */
  const cats = {
    entradas:  { es:"Entradas",            en:"Starters" },
    burgers:   { es:"Smash Burgers",       en:"Smash Burgers" },
    sandwich:  { es:"Sumo Sándwich",       en:"Sumo Sandwich" },
    burritos:  { es:"Burritos",            en:"Burritos" },
    hotdogs:   { es:"Hot Dogs",            en:"Hot Dogs" },
    frio:      { es:"Rollos · Sushi Frío", en:"Rolls · Cold Sushi" },
    caliente:  { es:"Rollos · Sushi Caliente", en:"Rolls · Hot Sushi" },
    dulce:     { es:"Rollos · Sushi Dulce",en:"Rolls · Sweet Sushi" },
    alitas:    { es:"Alitas y Boneless",   en:"Wings & Boneless" },
    postres:   { es:"Postres",             en:"Desserts" },
    salsas:    { es:"Salsas",              en:"Sauces" },
    extras:    { es:"Extras",              en:"Extras" },
    bebidas:   { es:"Bebidas",             en:"Drinks" }
  };

  /* helper d(name, es, en, img, price, badge) */
  function d(name, es, en, img, price, badge){ return { name, es, en, img: img?A+img:null, price: price||null, badge: badge||null }; }

  /* ---------- ENTRADAS ---------- */
  const entradas_base = [
    d("Yakimeshi Mixto","Arroz frito a la plancha con pollo, carne, huevo, mix de vegetales y ajonjolí.","Griddled fried rice with chicken, beef, egg, veggie mix and sesame.","yakimeshi_mixto.jpg",null),
    d("Yakimeshi Especial","Con pollo, carne, huevo, aguacate, queso crema, tampico y cebollín.","With chicken, beef, egg, avocado, cream cheese, tampico and chives.","yakimeshi_especial.jpg",null),
    d("Gohan Teriyaki","Arroz al vapor con pollo a la plancha en salsa teriyaki.","Steamed rice with griddled chicken in teriyaki sauce.","gohan_teriyaki.jpg",null),
    d("Gohan Especial","Arroz al vapor, aguacate, queso crema, tampico, surimi y ajonjolí.","Steamed rice, avocado, cream cheese, tampico, surimi and sesame.","gohan_especial.jpg",null),
    d("Papas a la Francesa","Con o sin queso. 200 g.","French fries, with or without cheese. 200 g.","papas_francesa.jpg",null),
    d("Papas Smash","Papas, carne smash, cebolla caramelizada, cebollín y aderezo.","Fries, smash beef, caramelized onion, chives and dressing.","papas_smash.jpg",null),
    d("Ramen","Pasta ramen en caldo de vegetales picante, tamaño XL.","Ramen noodles in spicy veggie broth, XL size.","ramen.jpg",null),
    d("Mac & Cheese","Pasta en salsa de queso, tocino, cebollín y jalapeños.","Pasta in cheese sauce, bacon, chives and jalapeños.","mac_cheese.jpg",null),
    d("Ensalada Sweet Kani","Pepino, mango, aguacate, lechuga, surimi y vinagreta de la casa.","Cucumber, mango, avocado, lettuce, surimi and house vinaigrette.","ensalada_kani.jpg",null),
    d("Yasai Tempura","Mix de vegetales en tempura. Aderezo mango habanero o piña habanero.","Veggie tempura. Mango-habanero or pineapple-habanero dip.","yasai_tempura.jpg",null),
    d("Sweet Corns","Rodajas de elote fritas y sazonadas con salsa chiltepín.","Fried seasoned corn with chiltepín sauce.","sweet_corns.jpg",null),
    d("Cinema Nachos","Totopos en queso fundido con chile jalapeño.","Tortilla chips in melted cheese with jalapeño.","cinema_nachos.jpg",null)
  ];
  const entradas_ayce = entradas_base.concat([ d("Kushiage de Queso","Queso manchego empanizado en panko. 3 pzas.","Panko-breaded manchego cheese. 3 pcs.",null,null) ]);
  const entradas_express = entradas_base.concat([ d("Aros de Cebolla","90 g. Aderezo mango habanero o piña habanero.","90 g. Mango-habanero or pineapple-habanero dip.",null,null) ]);

  /* ---------- SMASH BURGERS (ambos) ---------- */
  const burgers = [
    d("Burger Clásica","60 g de carne smash, queso amarillo, lechuga, cebolla morada y aderezo americano.","60 g smash patty, american cheese, lettuce, red onion and american dressing.","burger_clasica.jpg",null,"hazla doble o triple"),
    d("Burger del Barrio","Carne smash, queso amarillo, salchicha, piña, tocino, lechuga y aderezo.","Smash patty, american cheese, sausage, pineapple, bacon, lettuce and dressing.","burger_del_barrio.jpg",null,"hazla doble o triple"),
    d("Pulled Pork Burger","70 g de cerdo deshebrado bañado en salsa BBQ.","70 g pulled pork in BBQ sauce.","pulled_pork.jpg",null),
    d("Guacamole Burger","Carne smash, queso manchego, cebolla caramelizada, guacamole, Doritos® y salsa de queso.","Smash patty, manchego, caramelized onion, guacamole, Doritos® and cheese sauce.","guacamole_burger.jpg",null,"hazla doble o triple"),
    d("Spicy Smash","Carne smash, queso amarillo, cebolla caramelizada, chile serrano y aderezo de chile toreado.","Smash patty, american cheese, caramelized onion, serrano and toreado-chile dressing.","spicy_smash.jpg",null),
    d("BBQ Burger","Carne smash, queso amarillo, aros de cebolla, tocino y salsa BBQ.","Smash patty, american cheese, onion rings, bacon and BBQ sauce.","bbq_burger.jpg",null,"hazla doble o triple"),
    d("Spicy Chicken Burger","Tender de pollo, tocino miel, lechuga y aderezo americano.","Chicken tender, honey bacon, lettuce and american dressing.","spicy_chicken.jpg",null),
    d("Chicken Cheese Burger","Tender de pollo, queso manchego, cebolla morada y aderezo americano.","Chicken tender, manchego, red onion and american dressing.","chicken_cheese.jpg",null)
  ];

  /* ---------- SUMO SÁNDWICH (solo AYCE) ---------- */
  const sandwich = [
    d("Sumo Sándwich · Camarón","Sándwich de arroz empanizado: alga nori, queso crema, aguacate y camarón. Mayonesa chipotle y ajonjolí.","Breaded rice sandwich: nori, cream cheese, avocado and shrimp. Chipotle mayo and sesame.","sandwich_camaron.jpg",null),
    d("Sumo Sándwich · Surimi","Sándwich de arroz empanizado relleno de surimi, queso crema y aguacate.","Breaded rice sandwich with surimi, cream cheese and avocado.","sandwich_surimi.jpg",null),
    d("Sumo Sándwich · Salmón","Sándwich de arroz empanizado relleno de salmón, queso crema y aguacate.","Breaded rice sandwich with salmon, cream cheese and avocado.","sandwich_salmon.jpg",null)
  ];

  /* ---------- BURRITOS (solo Express) ---------- */
  const burritos = [
    d("Pulled Pork Burrito","140 g de cerdo deshebrado bañado en salsa BBQ y vegetales.","140 g pulled pork in BBQ sauce with veggies.","pulled_pork.jpg",null),
    d("Tender Burrito","120 g de tender de pollo, salsa original, blue cheese y vegetales.","120 g chicken tender, original sauce, blue cheese and veggies.","chicken_cheese.jpg",null)
  ];

  /* ---------- HOT DOGS (ambos) ---------- */
  const hotdogs = [
    d("Jumbo Sumo Dog","Hot dog jumbo con cebollas y pimientos a la BBQ.","Jumbo hot dog with BBQ onions and peppers.","jumbo_dog.jpg",null),
    d("Buffalo Ranch Dog","Aderezo americano, salsa Buffalo Ranch y papitas con sazonador cajún.","American dressing, Buffalo Ranch and cajun fries.","buffalo_dog.jpg",null),
    d("Smash Dog","Envuelto en tocino, carne smash, cebolla caramelizada, manchego y aderezo de chile toreado.","Bacon-wrapped, smash beef, caramelized onion, manchego and toreado-chile dressing.","smash_dog.jpg",null)
  ];

  /* ---------- ROLLOS (5 pzas) ---------- */
  const roll = (name, es, en, img) => d(name, es, en, img, null);
  const frio_ayce = [
    roll("Bora Bora","Dentro: queso crema, pepino y camarón empanizado. Fuera: mango y salsa de anguila.","In: cream cheese, cucumber, breaded shrimp. Out: mango and eel sauce.","roll_bora_bora.jpg"),
    roll("White Dragon","Dentro: camarón empanizado, piña asada y aguacate. Fuera: queso crema y salsa panthai.","In: breaded shrimp, grilled pineapple, avocado. Out: cream cheese and panthai sauce.","roll_white_dragon.jpg"),
    roll("Tiki Thai Roll","Dentro: camarón empanizado, pepino y piña. Fuera: aguacate, ajonjolí y salsa panthai.","In: breaded shrimp, cucumber, pineapple. Out: avocado, sesame and panthai sauce.","roll_tiki_thai.jpg"),
    roll("Filadelfia","Dentro: queso crema, aguacate y salmón. Fuera: mix de ajonjolí.","In: cream cheese, avocado, salmon. Out: sesame mix.","roll_filadelfia.jpg"),
    roll("Nipon Roll","Dentro: aguacate y surimi empanizado. Fuera: queso manchego, guacamole, pico de piña y chile serrano.","In: avocado, breaded surimi. Out: manchego, guacamole, pineapple pico and serrano.","roll_nipon.jpg"),
    roll("Luna Roll","Dentro: aguacate y pepino. Fuera: mango, camarones roca, pico de piña y salsa de chiltepín.","In: avocado, cucumber. Out: mango, rock shrimp, pineapple pico and chiltepín sauce.","roll_luna.jpg"),
    roll("California","Dentro: surimi, aguacate y pepino. Fuera: mix de ajonjolí.","In: surimi, avocado, cucumber. Out: sesame mix.",null),
    roll("Monkey Roll","Dentro: aguacate, kakiage de zanahoria y queso crema. Fuera: plátano macho, tampico y salsa de anguila.","In: avocado, carrot kakiage, cream cheese. Out: plantain, tampico and eel sauce.",null)
  ];
  const caliente_ayce = [
    roll("Rikishi Roll","Dentro: arroz frito, queso crema y camarón empanizado. Fuera: alga nori empanizada en salsa de anguila.","In: fried rice, cream cheese, breaded shrimp. Out: breaded nori in eel sauce.","roll_rikishi.jpg"),
    roll("Kekoto","Dentro: camarón empanizado, queso crema y aguacate. Fuera: tampico y mayonesa chipotle.","In: breaded shrimp, cream cheese, avocado. Out: tampico and chipotle mayo.","roll_kekoto.jpg"),
    roll("Banana Frie","Dentro: queso crema y surimi. Fuera: plátano macho frito y salsa de anguila.","In: cream cheese, surimi. Out: fried plantain and eel sauce.","roll_banana_frie.jpg"),
    roll("Sumo Roll","Dentro: aguacate, queso manchego y tender. Fuera: empanizado y salsa a escoger.","In: avocado, manchego, tender. Out: breaded with sauce of choice.","roll_sumo.jpg"),
    roll("Texas Roll","Dentro: carne de res, manchego, aguacate, chile serrano y cebollín. Fuera: papas fritas, mayonesa chipotle y BBQ.","In: beef, manchego, avocado, serrano, chives. Out: fries, chipotle mayo and BBQ.","roll_texas.jpg"),
    roll("Más de lo Mismo","Dentro: arroz frito, camarón empanizado y aguacate. Fuera: empanizado, queso crema, tampico y chile serrano en salsa de anguila.","In: fried rice, breaded shrimp, avocado. Out: breaded, cream cheese, tampico, serrano in eel sauce.","roll_mas.jpg"),
    roll("Coco Roll","Dentro: aguacate, piña y camarón empanizado. Fuera: empanizado con panko y coco, salsa piña chiltepín.","In: avocado, pineapple, breaded shrimp. Out: panko-coconut breaded, pineapple-chiltepín sauce.","roll_coco.jpg"),
    roll("Tempura Roll","Dentro: aguacate y camarón empanizado. Fuera: empanizado, queso manchego, mayonesa chipotle y cebollín. Sin alga.","In: avocado, breaded shrimp. Out: breaded, manchego, chipotle mayo, chives. No seaweed.","roll_tempura.jpg"),
    roll("Manchego Roll","Dentro: queso crema, aguacate, surimi empanizado, kakiage. Fuera: manchego derretido con chiles toreados. Sin alga.","In: cream cheese, avocado, breaded surimi, kakiage. Out: melted manchego with toreado chiles. No seaweed.","roll_manchego.jpg")
  ];
  const dulce_ayce = [
    roll("Canela Roll","Dentro: queso crema, plátano macho. Fuera: tempura dulce con azúcar y canela, salsa de chocolate.","In: cream cheese, plantain. Out: sweet tempura with cinnamon sugar, chocolate sauce.","roll_canela.jpg"),
    roll("Beach Roll","Dentro: queso crema, mango. Fuera: plátano macho en salsa de chocolate.","In: cream cheese, mango. Out: plantain in chocolate sauce.","roll_beach.jpg")
  ];
  // Express rolls (subset + Kyoto/Tokio/Japan)
  const frio_express = [
    frio_ayce.find(r=>r.name==="White Dragon"),
    frio_ayce.find(r=>r.name==="California"),
    frio_ayce.find(r=>r.name==="Filadelfia"),
    roll("Kyoto Roll","Dentro: pepino, camarón y aguacate. Fuera: mango, piña tempurizada y salsa de chiltepín.","In: cucumber, shrimp, avocado. Out: mango, tempura pineapple and chiltepín sauce.",null),
    roll("Tokio Roll","Dentro: camarón empanizado y aguacate. Fuera: suma de pepino, tampico tabasco, piña tempurizada y salsa de anguila.","In: breaded shrimp, avocado. Out: cucumber, tampico tabasco, tempura pineapple and eel sauce.",null),
    frio_ayce.find(r=>r.name==="Bora Bora")
  ];
  const caliente_express = [
    caliente_ayce.find(r=>r.name==="Rikishi Roll"),
    caliente_ayce.find(r=>r.name==="Kekoto"),
    caliente_ayce.find(r=>r.name==="Banana Frie"),
    caliente_ayce.find(r=>r.name==="Sumo Roll"),
    roll("Japan Roll","Dentro: kakiage de zanahoria, surimi empanizado, aguacate y queso crema. Fuera: tempura, tampico y salsa de anguila.","In: carrot kakiage, breaded surimi, avocado, cream cheese. Out: tempura, tampico and eel sauce.",null),
    caliente_ayce.find(r=>r.name==="Manchego Roll")
  ];
  const dulce_express = [ dulce_ayce.find(r=>r.name==="Canela Roll") ];

  /* ---------- ALITAS / SALSAS / POSTRES / EXTRAS ---------- */
  const alitas = [
    d("5 Alitas","Con una salsa a elegir.","With one sauce of choice.","alitas.jpg",null),
    d("Boneless 150 g","Trocitos de pollo empanizados bañados en una de nuestras salsas.","Breaded chicken bites tossed in one of our sauces.","alitas.jpg",null)
  ];
  const salsas = ["Parmesano","BBQ","Coronel","Sweet Hot","Maracuyá","Cajún","Jaguar","Lemon","Apple BBQ","Mango Habanero","Buffalo Ranch","Original"];
  const postres = [
    d("Camelado","Gelatina de café con crema de licor de café y brandy, helado de vainilla y crema batida. +18.","Coffee jelly with coffee-liqueur cream and brandy, vanilla ice cream and whipped cream. 18+.",null,109),
    d("Sumo Fries","Papa camote frita, tocino maple, helado de vainilla.","Fried sweet-potato, maple bacon, vanilla ice cream.",null,149),
    d("Sumo Bites","Centro de dona espolvoreado con azúcar y canela, salsa de chocolate, helado y crema batida.","Donut holes with cinnamon sugar, chocolate sauce, ice cream and whipped cream.",null,129),
    d("Cheesecake de Oreo","Cheesecake de Oreo sobre base de chocolate, decorado con polvo de galleta.","Oreo cheesecake on a chocolate base, topped with cookie crumble.",null,149),
    d("Pastel Conejo Turín","Pastel de Conejo Turín sobre base de chocolate líquido.","Conejo Turín cake on a liquid-chocolate base.",null,149)
  ];
  const extras = [
    {name:"Tampico",g:"60 g",price:25},{name:"Aguacate",g:"60 g",price:25},{name:"Mayonesa Chipotle",g:"60 g",price:22},
    {name:"Salsa de Anguila",g:"60 g",price:22},{name:"Queso Crema",g:"50 g",price:22},{name:"Aderezo Blue Cheese",g:"60 g",price:25},
    {name:"Aderezo Ranch",g:"60 g",price:25},{name:"Salsa Extra",g:"60 g",price:22},{name:"Vegetales",g:"40 g",price:25},{name:"Aderezo de Ajo",g:"60 g",price:25}
  ];

  /* ---------- BEBIDAS (iguales para ambos · menú oficial SUMO) ---------- */
  const bebidas = [
    { grp:{es:"Coctelería Jumbo",en:"Jumbo Cocktails"}, note:{es:"960 ml",en:"960 ml"}, items:[
      {name:"Margacheve", img:"assets/drinks/margacheve.jpg", es:"Margarita frozen con tequila, escarchada de chamoy y la cerveza de tu elección.", en:"Frozen margarita with tequila, chamoy rim and the beer of your choice.", price:169},
      {name:"Sangría Sumo", img:"assets/drinks/sangria_sumo.jpg", es:"Vodka, vino tinto, limón y refresco de sangría, escarchado con pulpa de Pelón.", en:"Vodka, red wine, lime and sangria soda, Pelón-pulp rim.", price:139},
      {name:"Limonada Eléctrica", img:"assets/drinks/limonada_electrica.jpg", es:"Limonada con jugo de naranja, curazao y vodka.", en:"Lemonade with orange juice, curaçao and vodka.", price:139},
      {name:"Baby Sumo", img:"assets/drinks/baby_sumo.jpg", es:"Bacardí Raspberry, jugo de arándano y refresco ameyal, escarchado pica fresa.", en:"Bacardí Raspberry, cranberry and ameyal soda, strawberry-chili rim.", price:149},
      {name:"Mojito", img:"assets/drinks/mojito.jpg", es:"Clásico con ron y hierbabuena; elige tu sabor.", en:"Classic with rum and mint; pick your flavor.", price:149},
      {name:"Asumito", img:"assets/drinks/asumito.jpg", es:"Vodka Skyy, jugo de limón, Sprite y bebida de mora azul.", en:"Skyy vodka, lime, Sprite and blue-raspberry.", price:149}
    ]},
    { grp:{es:"Cantaritos & Vasos SUMO",en:"Cantaritos & SUMO Cups"}, items:[
      {name:"Cantarito Fest", img:"assets/drinks/cantarito.jpg", es:"Jarrito de barro con tequila reposado, limón y naranja, escarchado con tajín. Sabores: clásico, guayaba, piña, jamaica o frutos rojos.", en:"Clay cup with reposado tequila, lime and orange, tajín rim. Flavors: classic, guava, pineapple, hibiscus or red berries.", price:155},
      {name:"Vaso SUMO · Ron", img:"assets/drinks/vaso_sumo.jpg", es:"960 ml con 120 ml de Bacardí blanco y mezclador.", en:"960 ml with 120 ml Bacardí white and mixer.", price:159},
      {name:"Vaso SUMO · Tequila", es:"960 ml con 120 ml de Jose Cuervo Especial y mezclador.", en:"960 ml with 120 ml Jose Cuervo Especial and mixer.", price:159},
      {name:"Vaso SUMO · Vodka", es:"960 ml con 120 ml de Skyy y mezclador.", en:"960 ml with 120 ml Skyy and mixer.", price:159},
      {name:"Vaso SUMO · Whisky", es:"960 ml con 120 ml de Black & White y mezclador.", en:"960 ml with 120 ml Black & White and mixer.", price:159},
      {name:"Vaso New Mix", es:"120 ml a elegir pikosito o paloma, con 2 latas New Mix.", en:"120 ml pikosito or paloma, with 2 New Mix cans.", price:159},
      {name:"Vaso Jack Daniel's", es:"120 ml con 2 latas Jack Daniel's (mineral, ginger o manzana).", en:"120 ml with 2 Jack Daniel's cans (mineral, ginger or apple).", price:159},
      {name:"Tropical SUMO", img:"assets/drinks/tropical_sumo.jpg", es:"Malibú, Bacardí blanco, pulpa de mandarina, arándano y limón. 960 ml.", en:"Malibú, Bacardí white, mandarin pulp, cranberry and lime. 960 ml.", price:169}
    ]},
    { grp:{es:"Sin alcohol",en:"Non-alcoholic"}, items:[
      {name:"Piñada", img:"assets/drinks/pinada.jpg", es:"Piña colada sin alcohol. 440 ml (Jumbo $139).", en:"Alcohol-free piña colada. 440 ml (Jumbo $139).", price:79},
      {name:"Bora Bora", img:"assets/drinks/bora_bora.jpg", es:"Jugo de piña, maracuyá, limón y granadina. 440 ml.", en:"Pineapple, passion fruit, lime and grenadine. 440 ml.", price:79},
      {name:"Punch", img:"assets/drinks/punch.jpg", es:"Arándano, manzana, limón y granadina. 440 ml.", en:"Cranberry, apple, lime and grenadine. 440 ml.", price:79},
      {name:"Iceberg Lemon", img:"assets/drinks/iceberg_lemon.jpg", es:"Flotante de limón, jugo de uva, cereza y granadina. 960 ml.", en:"Lemon float, grape juice, cherry and grenadine. 960 ml.", price:139},
      {name:"Sakura Fresa", img:"assets/drinks/sakura_fresa.jpg", es:"Flotante de fresa, limón, cereza y hierbabuena. 960 ml.", en:"Strawberry float, lime, cherry and mint. 960 ml.", price:139},
      {name:"Lychee Cooler", img:"assets/drinks/lychee_cooler.jpg", es:"Flotante de lychee, arándano, limón y kiwi. 960 ml.", en:"Lychee float, cranberry, lime and kiwi. 960 ml.", price:139}
    ]},
    { grp:{es:"Refrescos y bebidas",en:"Sodas & drinks"}, items:[
      {name:"Refresco", img:"assets/drinks/refresco_jumbo.jpg", es:"355 ml · Jumbo 960 ml $129.", en:"355 ml · Jumbo 960 ml $129.", price:69},
      {name:"Té helado", es:"600 ml.", en:"600 ml.", price:69},
      {name:"Agua embotellada", es:"600 ml.", en:"600 ml.", price:59},
      {name:"Limonada / Naranjada mineral", es:"440 ml.", en:"440 ml.", price:59},
      {name:"Limonada Jumbo", es:"960 ml · fresa, tamarindo, mora, maracuyá, limón o naranja.", en:"960 ml · strawberry, tamarind, blackberry, passion fruit, lemon or orange.", price:99},
      {name:"Jarra de limonada / naranjada", es:"Mineral, 1.9 L.", en:"Sparkling, 1.9 L.", price:199},
      {name:"Jarra de jugo", es:"1.9 L · uva, naranja, piña o manzana.", en:"1.9 L · grape, orange, pineapple or apple.", price:199}
    ]},
    { grp:{es:"Café y digestivos",en:"Coffee & digestifs"}, items:[
      {name:"Carajillo Clásico", img:"assets/drinks/carajillo_clasico.jpg", es:"240 ml.", en:"240 ml.", price:149},
      {name:"Carajillo Mazapán", img:"assets/drinks/carajillo_mazapan.jpg", es:"240 ml.", en:"240 ml.", price:149},
      {name:"Carajillo Baileys", img:"assets/drinks/carajillo_baileys.jpg", es:"240 ml.", en:"240 ml.", price:169},
      {name:"Café americano", es:"270 ml.", en:"270 ml.", price:59},
      {name:"Espresso", es:"60 ml.", en:"60 ml.", price:49},
      {name:"Bunny shot", es:"145 ml.", en:"145 ml.", price:115}
    ]},
    { grp:{es:"Cervezas & destilados",en:"Beers & spirits"}, note:{es:"Copeo 2×1 en destilados todos los días",en:"2-for-1 spirits every day"}, items:[
      {name:"Cerveza nacional", es:"Indio, Tecate, XX o Sol. 325–355 ml.", en:"Indio, Tecate, XX or Sol. 325–355 ml.", price:59},
      {name:"Cerveza premium", es:"Bohemia, Amstel Ultra o Heineken. 355 ml.", en:"Bohemia, Amstel Ultra or Heineken. 355 ml.", price:79},
      {name:"Caguamón en bolsa", es:"Cerveza Indio o XX Lager.", en:"Indio or XX Lager caguama.", price:149},
      {name:"Jarra de cerveza", es:"1.8 L.", en:"1.8 L.", price:179},
      {name:"Ron 2×1 (copeo)", es:"Bacardí blanco o Matusalem. 2 copas de 60 ml + mezclador.", en:"Bacardí white or Matusalem. 2× 60 ml + mixer.", price:119},
      {name:"Vodka 2×1 (copeo)", es:"Skyy o Smirnoff de tamarindo.", en:"Skyy or tamarind Smirnoff.", price:139},
      {name:"Tequila 2×1 (copeo)", es:"Jose Cuervo Tradicional o Jimador.", en:"Jose Cuervo Tradicional or Jimador.", price:149},
      {name:"Whisky 2×1 (copeo)", es:"Jim Beam, J.W. Etiqueta Roja o Jack Daniel's.", en:"Jim Beam, J.W. Red Label or Jack Daniel's.", price:169},
      {name:"Cremas y licores 2×1", es:"Licor 43 o Baileys.", en:"Licor 43 or Baileys.", price:169},
      {name:"Mezcal / Ginebra 2×1", es:"Amores, 400 Conejos o Tanqueray.", en:"Amores, 400 Conejos or Tanqueray.", price:249},
      {name:"Combo mezcladores", es:"2 sabores y 2 minerales de 355 ml (con botella, 4 personas).", en:"2 flavors and 2 mixers 355 ml (with bottle, 4 people).", price:189}
    ]}
  ];

  /* ---------- Estructura de menú por tipo y modalidad ---------- */
  // section: { cat, modality:'buffet'|'carta', items }
  const menus = {
    ayce: {
      buffet: [
        {cat:"entradas", items:entradas_ayce},
        {cat:"burgers", items:burgers},
        {cat:"sandwich", items:sandwich},
        {cat:"hotdogs", items:hotdogs},
        {cat:"frio", items:frio_ayce},
        {cat:"caliente", items:caliente_ayce},
        {cat:"dulce", items:dulce_ayce},
        {cat:"alitas", items:alitas},
        {cat:"bebidas", bebidas:true},
        {cat:"salsas", salsas:true},
        {cat:"extras", extras:extras}
      ],
      // A la carte: mismas familias, precios provienen de la carta (PDF). Marcamos pendiente.
      carta: [
        {cat:"entradas", items:entradas_ayce},
        {cat:"burgers", items:burgers},
        {cat:"sandwich", items:sandwich},
        {cat:"hotdogs", items:hotdogs},
        {cat:"frio", items:frio_ayce},
        {cat:"caliente", items:caliente_ayce},
        {cat:"dulce", items:dulce_ayce},
        {cat:"alitas", items:alitas},
        {cat:"bebidas", bebidas:true}
      ]
    },
    express: {
      buffet: [
        {cat:"entradas", items:entradas_express},
        {cat:"burgers", items:burgers},
        {cat:"burritos", items:burritos},
        {cat:"hotdogs", items:hotdogs},
        {cat:"frio", items:frio_express},
        {cat:"caliente", items:caliente_express},
        {cat:"dulce", items:dulce_express},
        {cat:"postres", items:postres},
        {cat:"alitas", items:alitas},
        {cat:"bebidas", bebidas:true},
        {cat:"salsas", salsas:true},
        {cat:"extras", extras:extras}
      ]
    }
  };

  const typeInfo = {
    ayce:    { name:"SUMO AYCE",    tag:{es:"All You Can Eat",en:"All You Can Eat"}, modalities:["buffet","carta"], accent:"#FF6B2B",
               blurb:{es:"Todo el All You Can Eat + menú a la carta. La experiencia SUMO completa, para sentarte y repetir.",en:"All You Can Eat + à la carte. The full SUMO experience — sit down and refill."} },
    express: { name:"SUMO Express", tag:{es:"Formato compacto",en:"Compact format"}, modalities:["buffet"], accent:"#2E7CF6",
               blurb:{es:"El mismo All You Can Eat de SUMO en un formato más chico y ágil. Mismo sabor, espacio compacto.",en:"The same unlimited SUMO all-you-can-eat in a smaller, nimbler format. Same flavor, compact space."} },
  };

  const posters = {
    ayce: [P+"ayce_buffet_1.jpeg", P+"ayce_buffet_2.jpeg"],
    express: [P+"express_buffet_1.jpg", P+"express_buffet_2.jpg"]
  };
  const brand = { mascotaFries:B+"mascota_fries.jpg", mascotaBowl:B+"mascota_bowl.jpg" };

  /* ---------- PROMOCIONES (semilla editable · mapea a WordPress) ----------
     Estructura pensada para CRUD: cada promo es un registro editable.
     En producción esta lista vendría de WordPress (REST API / ACF). */
  const promosSeed = [
    { id:"p-ramen",  active:true, color:"orange", type:"all",
      badge:{es:"MARTES",en:"TUESDAY"}, title:{es:"2×1 en Ramen",en:"2-for-1 Ramen"},
      desc:{es:"El segundo ramen va por nuestra cuenta, toda la noche.",en:"Your second ramen is on us, all night."},
      validity:{es:"Todos los martes",en:"Every Tuesday"} },
    { id:"p-cumple", active:true, color:"pink", type:"all",
      badge:{es:"CUMPLE",en:"BIRTHDAY"}, title:{es:"El festejado come gratis",en:"Guest of honor eats free"},
      desc:{es:"Trae a 4+ personas y tu All You Can Eat es cortesía. Solo presenta tu ID.",en:"Bring 4+ and your All You Can Eat is free. Just show your ID."},
      validity:{es:"Todo el año",en:"Year-round"} },
    { id:"p-kids",   active:true, color:"blue", type:"all",
      badge:{es:"KIDS",en:"KIDS"}, title:{es:"Niños al 50%",en:"Kids 50% off"},
      desc:{es:"Menores de 10 años pagan mitad de precio en sucursal.",en:"Under-10s pay half price in-store."},
      validity:{es:"Lunes a viernes",en:"Mon–Fri"} },
    { id:"p-express",active:true, color:"blue", type:"express",
      badge:{es:"EXPRESS",en:"EXPRESS"}, title:{es:"Envío gratis en tu 1er pedido",en:"Free delivery on your 1st order"},
      desc:{es:"Pide por WhatsApp en cualquier sucursal Express y el envío va por nuestra cuenta.",en:"Order via WhatsApp at any Express location and delivery is on us."},
      validity:{es:"Nuevos clientes",en:"New customers"} },
    { id:"p-postre", active:true, color:"yellow", type:"express",
      badge:{es:"DULCE",en:"SWEET"}, title:{es:"Postre de cortesía",en:"Free dessert"},
      desc:{es:"En Express, postre gratis al compartir tu visita en redes con #SUMO.",en:"At Express, a free dessert when you share your visit with #SUMO."},
      validity:{es:"Vigencia limitada",en:"Limited time"} }
  ];

  /* ---------- RESEÑAS GOOGLE (prueba social en Home) ---------- */
  const reviews = [
    { author:"Mariana G.", stars:5, source:"Google", branch:"Coyoacán",
      es:"El mejor all you can eat de sushi de la zona. El Dragon Roll es otro nivel y el servicio rapidísimo.",
      en:"Best all-you-can-eat sushi around. The Dragon Roll is next level and service is super fast." },
    { author:"Diego R.", stars:5, source:"Google", branch:"Portal Centro",
      es:"Pedí por SUMO Express y llegó en 25 min, todo bien sellado y caliente. Repetiré sin duda.",
      en:"Ordered SUMO Express and it arrived in 25 min, sealed and hot. Definitely ordering again." },
    { author:"Paola M.", stars:5, source:"Google", branch:"Nápoles",
      es:"Ambiente increíble para ir con amigos. La promo de martes de ramen está imperdible.",
      en:"Amazing vibe to go with friends. The Tuesday ramen deal is a must." },
    { author:"Luis A.", stars:5, source:"Google", branch:"Satélite",
      es:"Buena variedad y precio justo para todo lo que comes. La sucursal siempre llena, mejor reservar.",
      en:"Great variety and fair price for all you eat. Always packed — better to book." },
    { author:"Andrea V.", stars:5, source:"Google", branch:"Del Valle",
      es:"Que las smash burgers entren en el All You Can Eat es una locura. Comí riquísimo, volveré pronto.",
      en:"Smash burgers being part of the all you can eat is wild. Ate so well, coming back soon." },
    { author:"Carlos T.", stars:5, source:"Google", branch:"Echegaray",
      es:"Servicio rapidísimo y los postres están deliciosos. Excelente relación calidad-precio.",
      en:"Super fast service and the desserts are delicious. Excellent value for money." }
  ];

  /* ---------- i18n de UI ---------- */
  const i18n = {
    es: {
      nav:{home:"Inicio",menu:"Menú",branches:"Sucursales",contact:"Contacto",promos:"Promos"},
      cta_reserve:"Reservar", cta_order:"Ver menú Express", cta_menu:"Ver menú", cta_branches:"Ver sucursales",
      lang:"EN", price_all:"All You Can Eat", everyday:"todos los días",
      buffet:"All You Can Eat", carta:"A la carta", free:"incluido", from:"desde",
      menu_intro:"Todo lo que ves es parte del All You Can Eat. Sí, todo.",
      find_branch:"Encuentra tu SUMO", use_location:"Usar mi ubicación", search_cp:"Código postal…", search:"Buscar",
      how_get:"Cómo llegar", call:"Llamar", contact_title:"Hablemos", contact_sub:"Elige tu sucursal y te conectamos directo por WhatsApp con ese local.",
      name:"Nombre", phone:"WhatsApp", message:"Mensaje", send:"Iniciar chat por WhatsApp", branch_type:"Tipo de sucursal",
      sauces_note:"Elige tu salsa — incluida en el All You Can Eat.", carta_pending:"Precios a la carta disponibles en sucursal.",
      promos_title:"Promociones", promos_sub:"Lo más dinámico de SUMO. Estas promos se editan desde el panel (conectado a WordPress).",
      promo_all:"Todas", promo_active:"Activa", promo_inactive:"Pausada", valid:"Vigencia",
      admin:"Editar promos", admin_on:"Modo edición", admin_add:"+ Nueva promo", admin_edit:"Editar", admin_del:"Eliminar", admin_save:"Guardar", admin_cancel:"Cancelar", admin_reset:"Restablecer", admin_note:"Demo del CRUD — en producción se administra desde WordPress.",
      reviews_title:"Nos aman en Google", reviews_sub:"Reseñas reales de quienes ya tienen su SUMO favorito.",
      pick_branch:"Elige sucursal", any_branch:"¿Cuál sucursal?",
      r_title:"Reserva tu mesa", r_sub:"Elige sucursal y horario. Confirmamos por WhatsApp al instante.",
      r_date:"Fecha", r_time:"Horario", r_people:"Personas", r_hours:"Horario de la sucursal",
      r_confirm:"Confirmar por WhatsApp", r_ok_title:"¡Casi listo!", r_ok_msg:"Te abrimos WhatsApp con tu reserva para que la confirmes con la sucursal.", r_open:"Abrir WhatsApp", r_another:"Hacer otra reserva"
    },
    en: {
      nav:{home:"Home",menu:"Menu",branches:"Locations",contact:"Contact",promos:"Deals"},
      cta_reserve:"Book a table", cta_order:"See Express menu", cta_menu:"See menu", cta_branches:"Find a location",
      lang:"ES", price_all:"All You Can Eat", everyday:"every day",
      buffet:"All You Can Eat", carta:"À la carte", free:"included", from:"from",
      menu_intro:"Everything you see is part of All You Can Eat. Yes, everything.",
      find_branch:"Find your SUMO", use_location:"Use my location", search_cp:"ZIP code…", search:"Search",
      how_get:"Directions", call:"Call", contact_title:"Let's talk", contact_sub:"Pick your location and we connect you straight to that store on WhatsApp.",
      name:"Name", phone:"WhatsApp", message:"Message", send:"Start WhatsApp chat", branch_type:"Location type",
      sauces_note:"Pick your sauce — included in the All You Can Eat.", carta_pending:"À la carte prices available in-store.",
      promos_title:"Deals", promos_sub:"SUMO's most dynamic part. These deals are edited from the panel (connected to WordPress).",
      promo_all:"All", promo_active:"Active", promo_inactive:"Paused", valid:"Valid",
      admin:"Edit deals", admin_on:"Edit mode", admin_add:"+ New deal", admin_edit:"Edit", admin_del:"Delete", admin_save:"Save", admin_cancel:"Cancel", admin_reset:"Reset", admin_note:"CRUD demo — in production this is managed from WordPress.",
      reviews_title:"Loved on Google", reviews_sub:"Real reviews from people who already have their favorite SUMO.",
      pick_branch:"Pick a location", any_branch:"Which location?",
      r_title:"Book your table", r_sub:"Pick a location and time. We confirm instantly on WhatsApp.",
      r_date:"Date", r_time:"Time", r_people:"Guests", r_hours:"Location hours",
      r_confirm:"Confirm on WhatsApp", r_ok_title:"Almost there!", r_ok_msg:"We'll open WhatsApp with your booking so you can confirm with the location.", r_open:"Open WhatsApp", r_another:"Make another booking"
    }
  };

  return { branches, cats, menus, typeInfo, posters, brand, i18n, salsas, bebidas, promosSeed, reviews, whatsapp:"525500000000",
           price_buffet:269, lang(){ return localStorage.getItem("sumo_lang")||"es"; },
           setLang(l){ localStorage.setItem("sumo_lang", l); } };
})();
