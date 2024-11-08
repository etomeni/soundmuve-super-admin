import { useCallback, useState } from "react";

import axios from "axios";
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';

import { useUserStore } from "@/state/userStore";
import { apiEndpoint, passwordRegex } from "@/util/resources";
// import { useSettingStore } from "@/state/settingStore";
import { userInterface } from "@/typeInterfaces/users.interface";
import { defaultUserLocation } from "@/util/location";
import { useSettingStore } from "@/state/settingStore";


const emailFormSchema = yup.object({
    email: yup.string().required()
    .email("Please enter a valid email address.")
    .matches(/^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)*|\"([^\\]\\\"]|\\.)*\")@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    , "Please enter a valid email address.")
    .trim().label("Email Address")
});

const newAdminPreviewSchema = yup.object({
    _id: yup.string().trim(),
    firstName: yup.string().required().min(2).trim().label("First Name"),
    lastName: yup.string().required().min(2).trim().label("Last Name"),

    email: yup.string().required()
    .email("Please enter a valid email address.")
    .matches(/^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)*|\"([^\\]\\\"]|\\.)*\")@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    , "Please enter a valid email address.")
    .trim().label("Email Address"),

    password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .matches(passwordRegex,
      'Password must include uppercase, lowercase, digit, and special character'
    ).trim().label("Password"),

    role: yup.string().required().min(3).trim().label("Role"),

    // tnc: yup.boolean().required().label("Terms and conditions")
});


export function useAddNewAdmin() {
    const accessToken = useUserStore((state) => state.accessToken);

    const _setToastNotification = useSettingStore((state) => state._setToastNotification);
    const [apiResponse, setApiResponse] = useState({
        display: false,
        status: true,
        message: ""
    });

    const [allAdmins, setAllAdmins] = useState<userInterface[]>();

    const [enteredEmail, setEnteredEmail] = useState('');
    const [emailUserData, setEmailUserData] = useState<userInterface>();
    // const [openNewAdminPreviewPage, setOpenNewAdminPreviewPage] = useState(false);
    const [newAdminCurrentPage, setNewAdminCurrentPage] = useState<"email" | "preview" | "success">("email");

    const emailForm = useForm({ 
        resolver: yupResolver(emailFormSchema),
        mode: 'onBlur', reValidateMode: 'onChange', 
    });

    const newAdminPreviewForm = useForm({ 
        resolver: yupResolver(newAdminPreviewSchema),
        mode: 'onBlur', // reValidateMode: 'onChange',
        defaultValues: {
            email: emailUserData?.email || enteredEmail,
            firstName: emailUserData?.firstName || "",
            lastName: emailUserData?.lastName || "",
            password: emailUserData?.password || "",
        }
    });


    const submitEmailForm = useCallback(async (formData: typeof emailFormSchema.__outputType) => {
        setEnteredEmail(formData.email);
        setApiResponse({
            display: false,
            status: true,
            message: ""
        });
    
        try {
            const response = (await axios.get(`${apiEndpoint}/admin/get-user-by-email`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: { email: formData.email }
            })).data;
            // console.log(response);
    
            if (response.status) {
                newAdminPreviewForm.setValue(
                    "email", formData.email,
                    {shouldDirty: true, shouldTouch: true, shouldValidate: true}
                );
                // setOpenNewAdminPreviewPage(true);
                setNewAdminCurrentPage("preview");

                if (response.result) {
                    setEmailUserData(response.result);

                    newAdminPreviewForm.setValue(
                        "_id", response.result._id || '',
                        {shouldDirty: true, shouldTouch: true, shouldValidate: true}
                    );

                    newAdminPreviewForm.setValue(
                        "firstName", response.result.firstName || '',
                        {shouldDirty: true, shouldTouch: true, shouldValidate: true}
                    );

                    newAdminPreviewForm.setValue(
                        "lastName", response.result.lastName || '',
                        {shouldDirty: true, shouldTouch: true, shouldValidate: true}
                    );

                    newAdminPreviewForm.setValue(
                        // "password", response.result.password,
                        "password", 'Nothing to 3ee Here @ya move on.',
                        {shouldDirty: true, shouldTouch: true, shouldValidate: true}
                    );


                    newAdminPreviewForm.setValue(
                        "role", response.result.role,
                        {shouldDirty: true, shouldTouch: true, shouldValidate: true}
                    );
                    
                };

            }
            
            setApiResponse({
                display: true,
                status: true,
                message: response.message
            });
    
        } catch (error: any) {
            console.log(error);
            
            const err = error.response ? error.response.data : error;
            const fixedErrorMsg = "Oooops, failed to send email otp. please try again.";
    
            setApiResponse({
                display: true,
                status: false,
                message: err.errors && err.errors.length ? err.errors[0].msg : err.message || fixedErrorMsg
            });
        }
    }, []);

    const submitNewAdminPreviewForm = useCallback(async (formData: typeof newAdminPreviewSchema.__outputType) => {
        try {
            if (formData.role == "role") {
                setApiResponse({
                    display: true,
                    status: false,
                    message: "Please select a role",
                });
                return;
            }

            const data2db = {
                user_id: formData._id || emailUserData?._id || null,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                location: defaultUserLocation,
                newRole: formData.role,
                tnc: true,
            };
            
            const response = (await axios.post(`${apiEndpoint}/admin/add-new-admin`, 
                data2db, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })).data;
            // console.log(response);
            
            if (response.status) {
                // todo open the success modal
                setNewAdminCurrentPage("success");

                setEmailUserData(response.result);
                setEnteredEmail(data2db.email);
            }
    
            _setToastNotification({
                display: true,
                status: "info",
                message: response.message,
            });
        } catch (error: any) {
            // console.log(error);
            const err = error.response.data || error;
            const fixedErrorMsg = "Oooops, registration failed. please try again.";
    
            setApiResponse({
                display: true,
                status: false,
                message: err.errors && err.errors.length ? err.errors[0].msg : err.message || fixedErrorMsg
            });
        }

    }, []);

    const getAllAdmins = useCallback(async () => {
        try {

            const response = (await axios.get(`${apiEndpoint}/admin/get-all-admin`, 
                {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })).data;
            // console.log(response);
            
            if (response.status) {
                setAllAdmins(response.result)
            }
        } catch (error: any) {
            // console.log(error);
            const err = error.response.data || error;
            const fixedErrorMsg = "Oooops, registration failed. please try again.";
    
            _setToastNotification({
                display: true,
                status: "error",
                message: err.errors && err.errors.length ? err.errors[0].msg : err.message || fixedErrorMsg
            });
        }

    }, []);

    const blockOrRemoveAdmin = useCallback(async (action: 'block' | 'remove', user_id: string) => {
        try {

            const response = (await axios.patch(`${apiEndpoint}/admin/block-remove-admin`, 
                { user_id, action }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })).data;
            // console.log(response);

            getAllAdmins();

            _setToastNotification({
                display: true,
                status: response.status ? "success" : "info",
                message: response.message
            });

        } catch (error: any) {
            // console.log(error);
            const err = error.response.data || error;
            const fixedErrorMsg = "Oooops, registration failed. please try again.";
    
            _setToastNotification({
                display: true,
                status: "error",
                message: err.errors && err.errors.length ? err.errors[0].msg : err.message || fixedErrorMsg
            });
        }

    }, []);


    return {
        apiResponse, setApiResponse,

        allAdmins, getAllAdmins,
        blockOrRemoveAdmin,

        enteredEmail,
        emailUserData, setEmailUserData,
        // openNewAdminPreviewPage, setOpenNewAdminPreviewPage,
        newAdminCurrentPage, setNewAdminCurrentPage,

        emailForm,
        // emailFormState: emailForm.formState,
        submitEmailForm: emailForm.handleSubmit(submitEmailForm),


        newAdminPreviewForm,
        submitNewAdminPreviewForm: newAdminPreviewForm.handleSubmit(submitNewAdminPreviewForm),

    }
}