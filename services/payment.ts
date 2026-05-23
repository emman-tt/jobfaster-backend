import {
  getAuthenticatedUser,
  lemonSqueezySetup,
} from "@lemonsqueezy/lemonsqueezy.js";
import "dotenv/config.js";
const { LEMON_SQUEEZY_API } = process.env;

lemonSqueezySetup({
  apiKey: LEMON_SQUEEZY_API,
  onError: (error) => console.error("Error!", error),
});

const { data, error } = await getAuthenticatedUser();

if (error) {
  console.log(error.message);
} else {
  console.log(data);
}
