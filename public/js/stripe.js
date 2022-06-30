/*eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51LG8VODVyWSOBs6IGLfSBQJ3sTpiKXvdCtajmDFS0kRHwjmPztoRGcj3I7fBNguHHaqn3zMeXanckh0GMgOWEPS100P8WooiVA'
  );
  try {
    //1 create session from API
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
    );

    // 2 create checkout form + charge credit card
    const result = await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
