/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

//type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  const url =
    type === 'userData'
      ? '/api/v1/users/update-me'
      : '/api/v1/users/update-password';

  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert(
        'success',
        `User ${type === 'userData' ? 'data' : 'password'} updated`
      );
      setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
