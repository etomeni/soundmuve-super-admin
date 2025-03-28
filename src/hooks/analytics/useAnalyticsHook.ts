import { useCallback, useState } from "react";

import * as yup from "yup";
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useUserStore } from "@/state/userStore";

import { useSettingStore } from "@/state/settingStore";
import { useGeneralStore } from "@/state/generalStore";
import { userInterface } from "@/typeInterfaces/users.interface";
import { releaseInterface } from "@/typeInterfaces/release.interface";
import { 
    analyticsInterface, locationAnalyticsInterface, totalAnalyticsInterface,
} from "@/typeInterfaces/analytics.interface";
import { useReleaseStore } from "@/state/releaseStore";
import apiClient, { apiErrorResponse } from "@/util/apiClient";



export type liveReleasesInterface = {
    user: userInterface,
    release: releaseInterface,
    lastUpdated: string,

    totalAnalytics: totalAnalyticsInterface,
    lastAnalytics: analyticsInterface
};

const formSchema = yup.object({
    date: yup.string().trim().required().label("Analytics Date"),
    albumSold: yup.string().required().trim().label("No. of Album sold"),
    noSold: yup.string().trim().required().label("No. of sold"),
    revenue: yup.string().trim().required().label("Revenue"),
    streamRevenue: yup.string().trim().required().label("Stream Revenue"),
    streamPlay: yup.string().trim().required().label("Stream Play"),
    location: yup.array().required().label("Location"),
});


export function useAnalyticsHook() {
    // const accessToken = useUserStore((state) => state.accessToken);
    const userData = useUserStore((state) => state.userData);

    const [limitNo, setLimitNo] = useState(25);
    const [currentPageNo, setCurrentPageNo] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [releases, setReleases] = useState<liveReleasesInterface[]>();
    const [datedAnalyticsData, setDatedAnalyticsData] = useState<analyticsInterface>();

    const [locationData, setLocationData] = useState<locationAnalyticsInterface[]>([]);
    const [selectedLocationData, setSelectedLocationData] = useState<locationAnalyticsInterface>();
    
    const selectedSong = useReleaseStore((state) => state.songDetails);
    const selectedAnalyticsDetails = useGeneralStore((state) => state.selectedAnalyticsDetails);
    const _setSelectedAnalyticsDetails = useGeneralStore((state) => state._setSelectedAnalyticsDetails);
    const _setToastNotification = useSettingStore((state) => state._setToastNotification);

    const analyticsForm = useForm({ 
        resolver: yupResolver(formSchema),
        mode: 'onBlur', reValidateMode: 'onChange',
        defaultValues: {
            albumSold: '0'
        }
    });
    
    const [apiResponse, setApiResponse] = useState({
        display: false,
        status: true,
        message: ""
    });


    const getLiveReleases = useCallback(async (pageNo: number, limitNo: number) => {
        setIsSubmitting(true);

        try {
            const response = (await apiClient.get(`/admin/analytics/live-releases`, {
                params: {
                    page: pageNo,
                    limit: limitNo,
                    // userType
                }
            })).data;
            // console.log(response);

            if (response.status) {
                setReleases(response.result.data);

                setCurrentPageNo(response.result.currentPage);
                setTotalPages(response.result.totalPages);
                setTotalRecords(response.result.totalRecords);

                setIsSubmitting(false);
            }

            _setToastNotification({
                display: true,
                status: "info",
                message: response.message
            });
    
        } catch (error: any) {
            apiErrorResponse(error, "Oooops, something went wrong", true);

            setIsSubmitting(false);
        }
    }, []);

    const getLiveReleaseById = useCallback(async (release_id: string, song_id: string) => {
        setIsSubmitting(true);

        try {
            const response = (await apiClient.get(`/admin/analytics/release-analytics`, {
                params: { release_id, song_id }
            })).data;
            // console.log(response);

            if (response.status) {
                _setSelectedAnalyticsDetails(response.result);
            }
    
            _setToastNotification({
                display: true,
                status: "info",
                message: response.message
            });
    
            setIsSubmitting(false);
        } catch (error: any) {
            apiErrorResponse(error, "Oooops, something went wrong", true);

            setIsSubmitting(false);
        }
    }, []);

    const getLiveReleaseByDate = useCallback(async (release_id: string, song_id: string, analytics_date: string) => {
        // setIsSubmitting(true);
        setDatedAnalyticsData(undefined);

        try {
            const response = (await apiClient.get(`/admin/analytics/dated-release-analytics`, {
                params: { release_id, song_id, analytics_date }
            })).data;
            // console.log(response);

            if (response.status) {
                setDatedAnalyticsData(response.result);
            }
    
            // _setToastNotification({
            //     display: true,
            //     status: "info",
            //     message: response.message
            // });
    
            // setIsSubmitting(false);
        } catch (error: any) {
            apiErrorResponse(error, "Oooops, something went wrong", true);

            // setIsSubmitting(false);
        }
    }, []);


    const searchLiveReleases = useCallback(async (searchWord: string, pageNo: number = 1, limitNo: number = 100) => {
        setIsSubmitting(true);

        try {
            const response = (await apiClient.get(`/admin/analytics/search`, {
                params: {
                    search: searchWord,
                    page: pageNo,
                    limit: limitNo,
                }
            })).data;
            // console.log(response);

            if (response.status) {
                setReleases(response.result.data);

                setCurrentPageNo(response.result.currentPage);
                setTotalPages(response.result.totalPages);
                setTotalRecords(response.result.totalRecords);

                setIsSubmitting(false);
            }
    
        } catch (error: any) {
            apiErrorResponse(error, "Oooops, something went wrong", true);

            setIsSubmitting(false);
        }
    }, []);

     
    const _onSubmit = async (formData: typeof formSchema.__outputType) => {
        setApiResponse({
            display: false,
            status: true,
            message: ""
        });

        // console.log(formData);

        if (!formData.location.length) {
            const errMsg = "Please set location analytics for top countries.";

            setApiResponse({
                display: true,
                status: false,
                message: errMsg
            });

            _setToastNotification({
                display: true,
                status: "error",
                message: errMsg
            });

            analyticsForm.setError("location", {message: errMsg});

            return;
        }

        try {
            const response = (await apiClient.post(`/admin/analytics/setAnalytics`, 
                { 
                    ...formData,
                    release_id: selectedAnalyticsDetails.release._id,
                    song_id: selectedSong._id,

                    analytics_id: datedAnalyticsData?._id,

                    admin_fullname: userData.firstName + " " + userData.lastName,
                    user_email: selectedAnalyticsDetails.user.email,
                    user_id: selectedAnalyticsDetails.user._id,
                }
            )).data;
            // console.log(response);

            if (response.status) {
                // _setContactDetails(response.result);

                // setReactQuillValue("");
                
                analyticsForm.reset();
                setLocationData([]);
                setSelectedLocationData(undefined);
            }

            _setToastNotification({
                display: true,
                status: "info",
                message: response.message || "successful!"
            });

        } catch (error: any) {
            const messageRes = apiErrorResponse(error, "Oooops, something went wrong", true);

            setApiResponse({
                display: true,
                status: false,
                message: messageRes
            });
        }
    }



    return {
        apiResponse, setApiResponse,
        limitNo, setLimitNo,

        currentPageNo, totalRecords,
        totalPages,

        locationData, setLocationData,
        selectedLocationData, setSelectedLocationData,

        releases,
        getLiveReleases,
        searchLiveReleases,

        isSubmitting,

        // start of form controls
        errors: analyticsForm.formState.errors,
        isValid: analyticsForm.formState.isValid,
        isSubmittingForm: analyticsForm.formState.isSubmitting,
        analyticsForm,
        onSubmit: analyticsForm.handleSubmit(_onSubmit),
        register: analyticsForm.register,
        // end of form controls

        datedAnalyticsData,
        getLiveReleaseById,
        getLiveReleaseByDate,
    }
}
