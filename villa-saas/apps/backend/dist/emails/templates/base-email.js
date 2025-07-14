"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.styles = exports.BaseEmail = void 0;
const React = __importStar(require("react"));
const components_1 = require("@react-email/components");
const BaseEmail = ({ previewText, children, tenantName = 'Villa SaaS', tenantLogo, footer, }) => {
    return (React.createElement(components_1.Html, null,
        React.createElement(components_1.Head, null),
        React.createElement(components_1.Preview, null, previewText),
        React.createElement(components_1.Body, { style: main },
            React.createElement(components_1.Container, { style: container },
                tenantLogo && (React.createElement(components_1.Section, { style: logoSection },
                    React.createElement(components_1.Img, { src: tenantLogo, width: "150", height: "auto", alt: tenantName, style: logo }))),
                children,
                footer && (React.createElement(React.Fragment, null,
                    React.createElement("hr", { style: hr }),
                    React.createElement(components_1.Text, { style: footerText }, footer)))))));
};
exports.BaseEmail = BaseEmail;
// Shared styles
exports.styles = {
    main: {
        backgroundColor: '#f6f9fc',
        fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
    },
    container: {
        backgroundColor: '#ffffff',
        margin: '0 auto',
        padding: '20px 0 48px',
        marginBottom: '64px',
        borderRadius: '5px',
    },
    logoSection: {
        textAlign: 'center',
        padding: '20px 0',
    },
    logo: {
        margin: '0 auto',
    },
    h1: {
        color: '#333',
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: '30px 0',
    },
    text: {
        color: '#333',
        fontSize: '16px',
        lineHeight: '26px',
        margin: '16px 40px',
    },
    infoSection: {
        backgroundColor: '#f4f4f5',
        borderRadius: '4px',
        margin: '20px 40px',
        padding: '24px',
    },
    infoTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '10px',
    },
    infoItem: {
        fontSize: '14px',
        lineHeight: '24px',
        color: '#333',
        margin: '8px 0',
    },
    button: {
        backgroundColor: '#5469d4',
        borderRadius: '4px',
        color: '#fff',
        fontSize: '16px',
        textDecoration: 'none',
        textAlign: 'center',
        display: 'inline-block',
        width: 'auto',
        padding: '12px 20px',
    },
    buttonSection: {
        textAlign: 'center',
        margin: '32px 0',
    },
    hr: {
        borderColor: '#e6ebf1',
        margin: '20px 0',
    },
    footerText: {
        color: '#8898aa',
        fontSize: '12px',
        lineHeight: '16px',
        margin: '16px 40px',
    },
    warningSection: {
        backgroundColor: '#fef3c7',
        borderRadius: '4px',
        margin: '20px 40px',
        padding: '16px 24px',
        border: '1px solid #fcd34d',
    },
    warningText: {
        fontSize: '14px',
        lineHeight: '20px',
        color: '#92400e',
        margin: 0,
    },
    successSection: {
        backgroundColor: '#d1fae5',
        borderRadius: '4px',
        margin: '20px 40px',
        padding: '16px 24px',
        border: '1px solid #6ee7b7',
    },
    successText: {
        fontSize: '14px',
        lineHeight: '20px',
        color: '#065f46',
        margin: 0,
    },
};
// Re-export individual styles for convenience
const { main, container, logoSection, logo, hr, footerText, } = exports.styles;
exports.default = exports.BaseEmail;
//# sourceMappingURL=base-email.js.map