declare module "mgt" {
    export namespace ts {
        export namespace Window {
            enum Type {
                Software = 0,
                OpenGL = 1,
                Vulkan = 2,
            }
        }

        export class Window { }
    }
}