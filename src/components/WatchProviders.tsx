import React from "react";

interface WatchProvider {
  name: string;
  logo: string;
  url?: string;
}

interface WatchProvidersProps {
  providers?: WatchProvider[];
}

export const WatchProviders: React.FC<WatchProvidersProps> = ({
  providers,
}) => {
  if (!providers || providers.length === 0) return null;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--text-tertiary)",
          marginBottom: "0.75rem",
        }}
      >
        Где смотреть
      </h3>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        {providers.map((provider, index) => (
          <a
            key={index}
            href={provider.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              textDecoration: "none",
              color: "var(--text-primary)",
              transition: "all 0.2s",
              cursor: provider.url ? "pointer" : "default",
            }}
            onMouseEnter={(e) => {
              if (provider.url) {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            {provider.logo && (
              <img
                src={provider.logo}
                alt={provider.name}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "4px",
                  objectFit: "cover",
                }}
              />
            )}
            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
              {provider.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};
