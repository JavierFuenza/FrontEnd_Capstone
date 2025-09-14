import React from "react";

export const NavBar = () => {
  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-600 text-white p-2 rounded-lg">
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"
                  stroke="white"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  
                  className="icon icon-tabler icons-tabler-outline icon-tabler-leaf">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 21c.5 -4.5 2.5 -8 7 -10" />
              <path d="M9 18c6.218 0 10.5 -3.288 11 -12v-2h-4.014c-9 0 -11.986 4 -12 9c0 1 0 3 2 5h3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Observatorio Ambiental</h1>
            <p className="text-sm text-gray-500">
              Datos ambientales en tiempo real
            </p>
          </div>
        </div>

        <ul className="flex space-x-8 text-gray-700 font-medium">
          <li>
            <a href="/mapa-interactivo" className="hover:text-emerald-600 flex justify-between items-center">
              <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="#616161"  strokeWdth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="stroke-current icon icon-tabler icons-tabler-outline icon-tabler-map-pin"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" /></svg>
              Mapa Interactivo
            </a>
          </li>
          <li>
            <a href="/graficos-personalizados" className="hover:text-emerald-600 flex justify-between items-center">
              <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="#616161"  strokeWdth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="stroke-current icon icon-tabler icons-tabler-outline icon-tabler-chart-bar"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M4 20h14" /></svg>
              Gráficos Personalizados
            </a>
          </li>
          <li>
            <a href="/api-docs" className="hover:text-emerald-600 flex justify-between items-center">
              <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="#616161"  strokeWdth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="stroke-current icon icon-tabler icons-tabler-outline icon-tabler-code"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 8l-4 4l4 4" /><path d="M17 8l4 4l-4 4" /><path d="M14 4l-4 16" /></svg>
              API
            </a>
          </li>
          <li>
            <a href="#precios" className="hover:text-emerald-600 flex justify-between items-center">
              <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="#616161"  strokeWdth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="stroke-current icon icon-tabler icons-tabler-outline icon-tabler-coin"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" /><path d="M12 7v10" /></svg>
              Precios
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};
