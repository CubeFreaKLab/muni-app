// Presentation metadata: course identifiers and publication status stay in course.ts.
export const environments = [
  { name:"Llegamos al valle", short:"Valle", assets:["portal", "casa", "agua", "colinas"], titles:["La llegada","Busca la casa","Junto al agua","Reconoce tu ruta"] },
  { name:"Un bosque con vida", short:"Bosque", assets:["arboles", "vecino", "hojas", "puente"], titles:["Sigue las huellas","Un pequeño vecino","Hojas del bosque","Cruza el bosque"] },
  { name:"La visita al pueblo", short:"Pueblo", assets:["hogar", "rincon", "mesa", "plazuela"], titles:["La puerta del hogar","Prepara tu rincón","La mesa lista","Una visita completa"] },
  { name:"Día de mercado", short:"Mercado", assets:["canasta", "puesto-tazas", "verduras", "puesto-flores"], titles:["Llena la canasta","Prepara el pedido","Ordena los puestos","El encargo completo"] },
  { name:"El jardín de colores", short:"Jardín", assets:["flores", "macetas", "hojas", "arco"], titles:["Flores del jardín","Grande y pequeño","Mira las diferencias","Cuida el jardín"] },
  { name:"La plaza de encuentros", short:"Plaza", assets:["banco", "encuentro", "mesa", "meta"], titles:["Llegamos a la plaza","El punto de encuentro","Todo en su lugar","La gran aventura"] },
];
export const WORLD_WIDTH=390, SEGMENT_HEIGHT=960, TRAIL_WIDTH=39;
export const nodePositions=[{x:154,y:180},{x:233,y:395},{x:248,y:610},{x:163,y:825}];

// Vignettes stay clear of native node hit areas and their labels.
export const vignettePositions = [
  { x: 238, offsetY: 25, width: 140, height: 126 },
  { x: 12, offsetY: 38, width: 139, height: 135 },
  { x: 16, offsetY: 34, width: 145, height: 134 },
  { x: 247, offsetY: 25, width: 132, height: 130 },
];
