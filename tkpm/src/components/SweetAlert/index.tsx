import Swal, { SweetAlertIcon } from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useEffect } from 'react';

type SweetAlertProps = {
    title: string;
    text: string;
    icon?: SweetAlertIcon;
    confirmButtonText?: string;
    denyButtonText?: string;
    cancelButtonText?: string;
    onConfirm?: () => void;
    onDenied?: () => void;
    onCancel?: () => void;
};

const MySwal = withReactContent(Swal);

const SweetAlert = ({
    title,
    text,
    icon = 'success',
    confirmButtonText = 'Confirm',
    denyButtonText = 'Deny',
    cancelButtonText = 'Cancel',
    onConfirm,
    onDenied,
    onCancel,
}: SweetAlertProps) => {
    useEffect(() => {
        MySwal.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            showDenyButton: onDenied !== undefined,
            confirmButtonText: confirmButtonText,
            denyButtonText: denyButtonText,
            cancelButtonText: cancelButtonText,
        }).then((result) => {
            if (result.isConfirmed) {
                if (onConfirm) onConfirm();
            } else if (result.isDenied) {
                if (onDenied) onDenied();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                if (onCancel) onCancel();
            }
        });
    }, [title, text, icon, confirmButtonText, denyButtonText, cancelButtonText, onConfirm, onDenied, onCancel]);

    return null;
};

export default SweetAlert;
