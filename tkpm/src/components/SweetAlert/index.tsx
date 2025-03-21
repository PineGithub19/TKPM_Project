import Swal, { SweetAlertIcon } from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useEffect } from 'react';

type SweetAlertProps = {
    title: string;
    text: string;
    icon?: SweetAlertIcon;
    onConfirm?: () => void;
    onCancel?: () => void;
};

const MySwal = withReactContent(Swal);

const SweetAlert = ({ title, text, icon = 'success', onConfirm, onCancel }: SweetAlertProps) => {
    useEffect(() => {
        MySwal.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
        }).then((result) => {
            if (result.isConfirmed) {
                if (onConfirm) onConfirm();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                if (onCancel) onCancel();
            }
        });
    }, [title, text, icon, onConfirm, onCancel]);

    return null;
};

export default SweetAlert;
