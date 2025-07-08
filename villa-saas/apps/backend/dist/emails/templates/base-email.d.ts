import * as React from 'react';
interface BaseEmailProps {
    previewText: string;
    children: React.ReactNode;
    tenantName?: string;
    tenantLogo?: string;
    footer?: string;
}
export declare const BaseEmail: ({ previewText, children, tenantName, tenantLogo, footer, }: BaseEmailProps) => React.JSX.Element;
export declare const styles: {
    main: {
        backgroundColor: string;
        fontFamily: string;
    };
    container: {
        backgroundColor: string;
        margin: string;
        padding: string;
        marginBottom: string;
        borderRadius: string;
    };
    logoSection: {
        textAlign: "center";
        padding: string;
    };
    logo: {
        margin: string;
    };
    h1: {
        color: string;
        fontSize: string;
        fontWeight: string;
        textAlign: "center";
        margin: string;
    };
    text: {
        color: string;
        fontSize: string;
        lineHeight: string;
        margin: string;
    };
    infoSection: {
        backgroundColor: string;
        borderRadius: string;
        margin: string;
        padding: string;
    };
    infoTitle: {
        fontSize: string;
        fontWeight: string;
        color: string;
        marginBottom: string;
    };
    infoItem: {
        fontSize: string;
        lineHeight: string;
        color: string;
        margin: string;
    };
    button: {
        backgroundColor: string;
        borderRadius: string;
        color: string;
        fontSize: string;
        textDecoration: string;
        textAlign: "center";
        display: string;
        width: string;
        padding: string;
    };
    buttonSection: {
        textAlign: "center";
        margin: string;
    };
    hr: {
        borderColor: string;
        margin: string;
    };
    footerText: {
        color: string;
        fontSize: string;
        lineHeight: string;
        margin: string;
    };
    warningSection: {
        backgroundColor: string;
        borderRadius: string;
        margin: string;
        padding: string;
        border: string;
    };
    warningText: {
        fontSize: string;
        lineHeight: string;
        color: string;
        margin: number;
    };
    successSection: {
        backgroundColor: string;
        borderRadius: string;
        margin: string;
        padding: string;
        border: string;
    };
    successText: {
        fontSize: string;
        lineHeight: string;
        color: string;
        margin: number;
    };
};
export default BaseEmail;
//# sourceMappingURL=base-email.d.ts.map