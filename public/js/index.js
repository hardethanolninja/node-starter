/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './leaflet';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { showAlert } from './alerts';

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutButton = document.querySelector('.nav__el--logout');
const dataForm = document.querySelector('.form-user-data');
const passForm = document.querySelector('.form-user-password');

if (mapBox) {
  // ----------------------------------------------
  // Get locations from HTML
  // ----------------------------------------------
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );

  displayMap(locations);
}

if (loginForm) {
  document.querySelector('.form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    login(email, password);
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}

if (dataForm) {
  dataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    updateSettings({ name, email }, 'userData');
  });
}

if (passForm) {
  passForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--update-pw').textContent = '...Updating';
    const passwordCurrent = document.querySelector('#password-current').value;
    const newPassword = document.querySelector('#password').value;
    const passwordConfirm = document.querySelector('#password-confirm').value;

    await updateSettings(
      { passwordCurrent, newPassword, passwordConfirm },
      'password'
    );

    document.querySelector('#password-current').value = '';
    document.querySelector('#password').value = '';
    document.querySelector('#password-confirm').value = '';
    document.querySelector('.btn--update-pw').textContent = 'Save Password';
  });
}
