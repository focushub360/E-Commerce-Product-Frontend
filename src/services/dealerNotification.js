import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import NotificationPanel from './NotificationPanel';

// Inside your existing parent component:
const [notifications, setNotifications] = useState([]);
const [showNotifications, setShowNotifications] = useState(false);

const fetchDealerNotifications = useCallback(async () => {
  try {
    const { data } = await api.get('/dealer-notifications');

    setNotifications(data.notifications || []);
  } catch (error) {
    console.error(
      'Failed to fetch dealer notifications:',
      error.response?.data || error.message
    );
  }
}, []);

useEffect(() => {
  fetchDealerNotifications();
}, [fetchDealerNotifications]);