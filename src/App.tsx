import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from './router';
import { useUserStore } from "./state/userStore";
import { useSettingStore } from "./state/settingStore";
// import { useReleaseStore } from "./state/releaseStore";

function App() {
    const _handleRestoreUser = useUserStore((state) => state._handleRestoreUser);
    const _restoreSettings = useSettingStore((state) => state._restoreSettings);
    // const _restoreReleaseDetails = useReleaseStore((state) => state._restoreReleaseDetails);
        
    const handleRefreshNredirect = () => {
        _restoreSettings();
        _handleRestoreUser();
        // _restoreReleaseDetails();
    }

    useEffect(() => {
        handleRefreshNredirect();
    }, []);

    return (
        <>
            <RouterProvider router={router} />
        </>
    )
}

export default App;