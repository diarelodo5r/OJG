import {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-GYG37SJ7.js";
import "./chunk-G54I4PBF.js";
import "./chunk-XA3EVXH3.js";
import "./chunk-WOZ2NCG6.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-236CQATO.js";
import "./chunk-J664UH4G.js";
import "./chunk-E4RTGEV2.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-UZVDJVY2.js";
import "./chunk-LD4QGHF3.js";
import "./chunk-AL556GDK.js";
import "./chunk-OKDEZAEH.js";
import "./chunk-DZYVYZU6.js";
import "./chunk-EUU3QNTG.js";
import "./chunk-OX3NRC6A.js";
import "./chunk-4B66QQPO.js";
import "./chunk-G5X7FFPB.js";
import "./chunk-5I6AY6Q3.js";
import "./chunk-VENV3F3G.js";
import "./chunk-L2BZS5YT.js";
import "./chunk-M2ECUVBC.js";
import "./chunk-ROD3SMNO.js";
import "./chunk-FAOSLULT.js";
import "./chunk-SPXVOIE2.js";
import "./chunk-UL5DGBIV.js";
import "./chunk-R4DALVGK.js";
import "./chunk-C254VXWU.js";
import "./chunk-VQRSL6LW.js";
import "./chunk-EGVRBFAU.js";
import "./chunk-5JKFW7ED.js";
import "./chunk-2ZKSKDON.js";
import "./chunk-ZGIIB46A.js";
import "./chunk-5EG33CFQ.js";
import "./chunk-LXLZ5BOL.js";
import "./chunk-HKUHDRPB.js";
import "./chunk-ABPWNASY.js";
import "./chunk-PK6Y6HIL.js";
import "./chunk-HMWPOMLB.js";
import "./chunk-F2MPXOLV.js";
import "./chunk-ZJ25XCV3.js";
import "./chunk-CTO7UN32.js";
import "./chunk-JRFR6BLO.js";
import "./chunk-HWYXSU2G.js";
import "./chunk-MARUHEWW.js";
import "./chunk-X4V3GT6M.js";

// node_modules/@angular/material/fesm2022/select.mjs
var matSelectAnimations = {
  // Represents
  // trigger('transformPanel', [
  //   state(
  //     'void',
  //     style({
  //       opacity: 0,
  //       transform: 'scale(1, 0.8)',
  //     }),
  //   ),
  //   transition(
  //     'void => showing',
  //     animate(
  //       '120ms cubic-bezier(0, 0, 0.2, 1)',
  //       style({
  //         opacity: 1,
  //         transform: 'scale(1, 1)',
  //       }),
  //     ),
  //   ),
  //   transition('* => void', animate('100ms linear', style({opacity: 0}))),
  // ])
  /** This animation transforms the select's overlay panel on and off the page. */
  transformPanel: {
    type: 7,
    name: "transformPanel",
    definitions: [
      {
        type: 0,
        name: "void",
        styles: {
          type: 6,
          styles: { opacity: 0, transform: "scale(1, 0.8)" },
          offset: null
        }
      },
      {
        type: 1,
        expr: "void => showing",
        animation: {
          type: 4,
          styles: {
            type: 6,
            styles: { opacity: 1, transform: "scale(1, 1)" },
            offset: null
          },
          timings: "120ms cubic-bezier(0, 0, 0.2, 1)"
        },
        options: null
      },
      {
        type: 1,
        expr: "* => void",
        animation: {
          type: 4,
          styles: { type: 6, styles: { opacity: 0 }, offset: null },
          timings: "100ms linear"
        },
        options: null
      }
    ],
    options: {}
  }
};
export {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatOptgroup,
  MatOption,
  MatPrefix,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger,
  MatSuffix,
  matSelectAnimations
};
//# sourceMappingURL=@angular_material_select.js.map
