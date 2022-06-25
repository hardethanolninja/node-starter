/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './leaflet';
import { login, logout } from './login';
import { updateData } from './updateSettings';

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutButton = document.querySelector('.nav__el--logout');
const updateButton = document.querySelector('.btn--updateUser');

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

if (updateButton) {
  updateButton.addEventListener('click', (e) => {
    e.preventDefault();
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    updateData(name, email);
  });
}
