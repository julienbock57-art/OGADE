import { Link } from "react-router-dom";

const tiles = [
  {
    title: "Matériels END",
    icon: "\u{1F527}", // wrench
    description: "Gestion des matériels de contrôle non destructif",
    to: "/materiels",
    bg: "bg-edf-blue",
  },
  {
    title: "Maquettes",
    icon: "\u{1F4E6}", // package
    description: "Gestion des maquettes et modèles",
    to: "/maquettes",
    bg: "bg-edf-blue/80",
  },
  {
    title: "Module logistique",
    icon: "\u{1F69A}", // truck
    description: "Demandes d'envoi et suivi logistique",
    to: "/demandes-envoi",
    bg: "bg-edf-light",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {tiles.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className={`${tile.bg} text-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col items-center text-center`}
          >
            <span className="text-4xl mb-4">{tile.icon}</span>
            <h2 className="text-xl font-semibold mb-2">{tile.title}</h2>
            <p className="text-sm opacity-90">{tile.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          to="/demandes-envoi/nouveau"
          className="inline-block bg-edf-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-edf-blue/90 transition-colors shadow"
        >
          Création d'une demande d'envoi mutualisée
        </Link>
      </div>
    </div>
  );
}
