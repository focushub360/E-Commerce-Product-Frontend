import api from '../utils/api';

// Customer clicks Notify Me
export const createNotifyMe = async (productId) => {
    const { data } = await api.post('/notify-me', {
        productId,
    });

    return data;
};

// Get customer's Notify Me subscriptions
export const getMyNotifications = async () => {
    const { data } = await api.get('/notify-me/my');

    return data;
};

// Check whether customer has subscribed for a product
export const getNotifyStatus = async (productId) => {
    const { data } = await api.get(
        `/notify-me/status/${productId}`
    );

    return data;
};

// Cancel a Notify Me subscription
export const cancelNotifyMe = async (notificationId) => {
    const { data } = await api.patch(
        `/notify-me/${notificationId}/cancel`
    );

    return data;
};