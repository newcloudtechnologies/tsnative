declare module "global" {

    //@ts-ignore
    @Size(3)
    //@ts-ignore
    @VTableSize(10)
    //@ts-ignore
    @VirtualDestructor
    export class Entity {
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