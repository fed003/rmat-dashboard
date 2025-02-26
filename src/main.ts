import { createApp } from "vue";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import * as components from "vuetify/components"; // Import all Vuetify components
import * as directives from "vuetify/directives"; // Import all Vuetify directives
import "./assets/main.css"; // Import global styles including Leaflet CSS
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import App from "./App.vue";

const vuetify = createVuetify({
	components, // Register all components
	directives, // Register all directives
});

const pinia = createPinia();

const app = createApp(App);
app.use(vuetify);
app.use(pinia);
app.mount("#app");
