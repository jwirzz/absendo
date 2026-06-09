import "react";

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "calendar-date": any;
            "calendar-month": any;
        }
    }
}
