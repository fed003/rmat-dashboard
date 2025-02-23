import { createApp } from "vue";
import "./assets/main.css"; // Import global styles including Leaflet CSS
import { createVuetify } from "vuetify";
import App from "./App.vue";
import * as components from "vuetify/components"; // Import all Vuetify components
import * as directives from "vuetify/directives"; // Import all Vuetify directives
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { createPinia } from "pinia";

const vuetify = createVuetify({
	components, // Register all components
	directives, // Register all directives
});

const pinia = createPinia();

const app = createApp(App);
app.use(vuetify);
app.use(pinia);
app.mount("#app");
