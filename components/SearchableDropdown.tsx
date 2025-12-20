"use client";

import { useState, useRef, useEffect } from "react";

interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  items: Array<{ id: string; name: string }>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  buttonLabel: string;
  onButtonClick: () => void;
  disabled?: boolean;
}

export function SearchableDropdown({
  label,
  placeholder,
  items,
  selectedId,
  onSelect,
  buttonLabel,
  onButtonClick,
  disabled = false,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItem = items.find((item) => item.id === selectedId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: "block",
          fontWeight: 600,
          color: "#7dd3fc",
          fontSize: 13,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>

      <div
        ref={dropdownRef}
        style={{
          position: "relative",
          marginBottom: 8,
        }}
      >
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,0.3)",
            background: "rgba(2,6,23,0.6)",
            color: selectedItem ? "#e2e8f0" : "#94a3b8",
            fontSize: 14,
            fontFamily: "inherit",
            boxSizing: "border-box",
            cursor: disabled ? "not-allowed" : "pointer",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <span>{selectedItem ? selectedItem.name : placeholder}</span>
          <span style={{ fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
        </button>

        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: 4,
              borderRadius: 8,
              border: "1px solid rgba(56,189,248,0.3)",
              background: "rgba(2,6,23,0.95)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              zIndex: 1000,
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "1px solid rgba(56,189,248,0.2)",
                background: "rgba(15,23,42,0.5)",
                color: "#e2e8f0",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
                borderBottom: "1px solid rgba(56,189,248,0.2)",
                marginBottom: 4,
              }}
            />

            {filteredItems.length === 0 ? (
              <div
                style={{
                  padding: 12,
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                No items found
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "none",
                    background:
                      selectedId === item.id
                        ? "rgba(0,212,255,0.15)"
                        : "transparent",
                    color: selectedId === item.id ? "#00d4ff" : "#e2e8f0",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: selectedId === item.id ? 600 : 400,
                    borderBottom: "1px solid rgba(56,189,248,0.1)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background =
                      "rgba(0,212,255,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background =
                      selectedId === item.id
                        ? "rgba(0,212,255,0.15)"
                        : "transparent";
                  }}
                >
                  {item.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <button
        onClick={onButtonClick}
        style={{
          width: "100%",
          padding: "10px 16px",
          borderRadius: 6,
          border: "1px solid rgba(168,85,247,0.4)",
          background: "rgba(168,85,247,0.15)",
          color: "#d8b4fe",
          fontWeight: 600,
          fontSize: 12,
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(168,85,247,0.25)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(168,85,247,0.15)";
        }}
      >
        + {buttonLabel}
      </button>
    </div>
  );
}
