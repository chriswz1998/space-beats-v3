import React from "react";
import GlobalLayout from "@/components/auth-layout";

const Layout = ({children}: {children: React.ReactNode}) => {
    return (
        <GlobalLayout>
            {children}
        </GlobalLayout>
    )
}

export default Layout;