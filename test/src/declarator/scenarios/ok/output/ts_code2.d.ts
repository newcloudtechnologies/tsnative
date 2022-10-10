declare module "global" {

    //@ts-ignore
    @VTableSize(9)
    //@ts-ignore
    @VirtualDestructor
    export class Entity {
        private p0_Entity: number;
        private p1_Entity: number;
        private p2_Entity: number;

        entity(): void;

        toString(): string;
        toNumber(): number;
        
        // @ts-ignore
        @MapsTo("operator==")
        private equals(string): boolean;
    }

    // @ts-ignore
    declare type string = String;
}
