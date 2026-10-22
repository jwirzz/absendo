import "react";

type CallyElementProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
    value?: string;
    min?: string;
    max?: string;
    locale?: string;
    "first-day-of-week"?: number | string;
};

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "calendar-date": CallyElementProps;
            "calendar-month": CallyElementProps;
        }
    }
}
