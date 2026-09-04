import { withAuthenticationRequired } from "@auth0/auth0-react";
import { PureComponent, useEffect, useState } from "react";

import { useParams, Navigate } from 'react-router-dom';

/**
 * AuthComponent is used by authentication guard. If the user is authenticated, 
 * it renders the specified component with the provided props. If the user is not authenticated,
 * it redirects them to the login page.
 * @param {any} param0
 * @returns
 */

const AuthComponent = ({ component, props, isAuthenticated }) => {

    //const Component = withAuthenticationRequired(component, {
    //    onRedirecting: () => (
    //        <div className="">
    //            {/*<PageLoader />*/}
    //            <div>Loading...</div>
    //        </div>
    //    ),
    //    returnTo: "/"
    //})

    const Component = component

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }
    else {
        return <Component {...props} />
    }
    

    //return <Component {...props} />
}

/**
 * What does AuthenticationGuard do?
 * It is a component that checks if the user is authenticated and if not, 
 * redirects them to the login page. If the user is authenticated, it renders 
 * the specified component with the provided props.
 * @param {any} param0
 * @returns 
 */

const AuthenticationGuard = ({ isAuthenticated, component, componentParams, publicUsername = null }) => {

    const urlParams = useParams()

    
    if (componentParams) {

        if (componentParams.page === "profilePublic") {

            componentParams.props.publicUsername = urlParams.username

        }

        console.log("COMPONENT PARAMS: ", componentParams)

    }

    else {
        componentParams = { props: {} }
    }

    //const Component = withAuthenticationRequired(component, {
    //    onRedirecting: () => (
    //        <div className="">
    //            {/*<PageLoader />*/}
    //            <div>Loading...</div>
    //        </div>
    //    ),
    //    returnTo: "/"
    //})
    


    //return componentParams ? <Component {...componentParams.props} /> : <Component />
    //return <Component {...componentParams.props} />
    return <AuthComponent component={component} props={componentParams.props} isAuthenticated={isAuthenticated} />
    //return <Component {...componentParams.props} />
};

export default AuthenticationGuard;