import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  InjectionToken,
  NgModule,
  effect,
  inject,
  input,
  linkedSignal,
  setClassMetadata,
  untracked,
  ɵɵdefineComponent,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵprojection,
  ɵɵprojectionDef
} from "./chunk-CTO7UN32.js";
import "./chunk-HWYXSU2G.js";
import "./chunk-JRFR6BLO.js";
import "./chunk-MARUHEWW.js";
import {
  __privateAdd,
  __privateGet,
  __privateMethod,
  __privateSet,
  __spreadValues
} from "./chunk-X4V3GT6M.js";

// node_modules/angular-tabler-icons/fesm2022/angular-tabler-icons.mjs
var _c0 = ["*"];
var OPTIONS_TOKEN = new InjectionToken("OPTIONS_TOKEN");
function upperCamelCase(str) {
  return str.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, (firstLetter) => {
    return firstLetter.toUpperCase();
  }).replace(/[-_]/g, "");
}
var _elem, _options, _svg, _TablerIconComponent_instances, getSvgIcon_fn;
var _TablerIconComponent = class _TablerIconComponent {
  constructor() {
    __privateAdd(this, _TablerIconComponent_instances);
    __privateAdd(this, _elem);
    __privateAdd(this, _options);
    __privateAdd(this, _svg);
    __privateSet(this, _elem, inject(ElementRef));
    __privateSet(this, _options, inject(OPTIONS_TOKEN));
    this.name = input.required();
    __privateSet(this, _svg, linkedSignal(() => __privateMethod(this, _TablerIconComponent_instances, getSvgIcon_fn).call(this, this.name())));
    this.setNativeSvg = effect(() => {
      const svg = __privateGet(this, _svg).call(this);
      if (!svg) {
        return;
      }
      untracked(() => {
        __privateGet(this, _elem).nativeElement.innerHTML = svg;
      });
    });
  }
};
_elem = new WeakMap();
_options = new WeakMap();
_svg = new WeakMap();
_TablerIconComponent_instances = new WeakSet();
/**
 * Retrieves the SVG markup for a given icon name from the configured icon sets.
 *
 * @param iconName - The name of the icon to retrieve in kebab-case format
 * @returns The SVG markup string for the icon, or an empty string if not found
 *
 * @remarks
 * This method:
 * - Merges all icon sets from the configured options
 * - Converts the icon name to upper camel case and prepends "Icon"
 * - Returns empty string if icon name is undefined
 * - Logs a warning if icon is not found (unless warnings are ignored in options)
 */
getSvgIcon_fn = function(iconName) {
  const icons = Object.assign({}, ...__privateGet(this, _options).map((option) => option.icons));
  if (!iconName) {
    return "";
  }
  const icon = `Icon${upperCamelCase(iconName)}`;
  const svg = icons?.[icon] ?? "";
  if (!svg && !__privateGet(this, _options).some((option) => option.ignoreWarnings)) {
    console.warn(`Tabler Icon not found: ${iconName}

         Refer to documentation on https://github.com/pierreavn/angular-tabler-icons`);
  }
  return svg;
};
_TablerIconComponent.ɵfac = function TablerIconComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _TablerIconComponent)();
};
_TablerIconComponent.ɵcmp = ɵɵdefineComponent({
  type: _TablerIconComponent,
  selectors: [["i-tabler"], ["tabler-icon"]],
  inputs: {
    name: [1, "name"]
  },
  ngContentSelectors: _c0,
  decls: 1,
  vars: 0,
  template: function TablerIconComponent_Template(rf, ctx) {
    if (rf & 1) {
      ɵɵprojectionDef();
      ɵɵprojection(0);
    }
  },
  styles: ["[_nghost-%COMP%]{display:inline-block;width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round}"],
  changeDetection: 0
});
var TablerIconComponent = _TablerIconComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TablerIconComponent, [{
    type: Component,
    args: [{
      selector: "i-tabler, tabler-icon",
      template: `<ng-content />`,
      changeDetection: ChangeDetectionStrategy.OnPush,
      styles: [":host{display:inline-block;width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round}\n"]
    }]
  }], null, null);
})();
var _TablerIconsModule = class _TablerIconsModule {
  constructor() {
    this.options = inject(OPTIONS_TOKEN, {
      optional: true
    });
    if (!this.options) {
      throw new Error(`No icon provided. Make sure to use 'TablerIconsModule.pick({ ... })' when importing the module
Refer to documentation on https://github.com/pierreavn/angular-tabler-icons`);
    }
  }
  /**
   * Initialize module with given icons and options
   * @param icons
   * @returns Module with options
   */
  static pick(icons, options) {
    return {
      ngModule: _TablerIconsModule,
      providers: [{
        provide: OPTIONS_TOKEN,
        useValue: __spreadValues({
          icons
        }, options),
        multi: true
      }]
    };
  }
};
_TablerIconsModule.ɵfac = function TablerIconsModule_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _TablerIconsModule)();
};
_TablerIconsModule.ɵmod = ɵɵdefineNgModule({
  type: _TablerIconsModule,
  imports: [TablerIconComponent],
  exports: [TablerIconComponent]
});
_TablerIconsModule.ɵinj = ɵɵdefineInjector({});
var TablerIconsModule = _TablerIconsModule;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TablerIconsModule, [{
    type: NgModule,
    args: [{
      imports: [TablerIconComponent],
      exports: [TablerIconComponent]
    }]
  }], () => [], null);
})();
function provideTablerIcons(icons, options) {
  return [{
    provide: OPTIONS_TOKEN,
    useValue: __spreadValues({
      icons
    }, options),
    multi: true
  }];
}
export {
  TablerIconComponent,
  TablerIconsModule,
  provideTablerIcons
};
//# sourceMappingURL=angular-tabler-icons.js.map
