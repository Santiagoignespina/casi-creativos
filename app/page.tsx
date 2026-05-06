"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const WA_PATH =
  "M16.001 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.6 4.46 1.73 6.4L3.2 28.8l6.55-1.71a12.74 12.74 0 0 0 6.25 1.6h.01c7.07 0 12.8-5.73 12.8-12.8 0-3.42-1.33-6.63-3.75-9.05A12.72 12.72 0 0 0 16.001 3.2zm0 23.36h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.89 1.02 1.04-3.79-.25-.4a10.62 10.62 0 0 1-1.62-5.68c0-5.87 4.78-10.65 10.66-10.65 2.85 0 5.52 1.11 7.53 3.13a10.58 10.58 0 0 1 3.12 7.53c0 5.87-4.78 10.65-10.66 10.65zm5.84-7.97c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.51-.16-.72.16-.21.32-.83 1.04-1.02 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.53-.54-.72-.55-.19-.01-.4-.01-.61-.01-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.15 3.09 1.31 3.3.16.21 2.27 3.46 5.5 4.85.77.33 1.37.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37z";

type PriceItem = { tier: string; price: string; cantidad: number; recommended?: boolean };

const PRICE_ITEMS: PriceItem[] = [
  { tier: "✅ 10.000 fichas", price: "$4.000", cantidad: 10000 },
  { tier: "✅ 20.000 fichas", price: "$7.500", cantidad: 20000 },
  { tier: "✅ 50.000 fichas", price: "$20.000", cantidad: 50000 },
  { tier: "✅ 100.000 fichas", price: "$30.000", cantidad: 100000, recommended: true },
  { tier: "✅ 200.000 fichas", price: "$50.000", cantidad: 200000 },
];

const FAQS = [
  {
    q: "¿Es seguro hacer la transferencia?",
    a: "Sí, totalmente. En cuanto recibimos tu transferencia, confirmamos el pedido de manera inmediata y nos contactamos con vos para coordinar la entrega.",
  },
  {
    q: "¿Cuánto tarda la entrega?",
    a: "En cuanto confirmamos tu pago, empezamos a preparar tu pedido. El tiempo de entrega depende de tu localidad y lo coordinamos directamente con vos por WhatsApp.",
  },
  {
    q: "¿Qué pasa si tengo un problema con mi compra?",
    a: "Escribinos directamente por WhatsApp. Respondemos rápido y siempre buscamos la mejor solución para que estés conforme con tu compra.",
  },
  {
    q: "¿Puedo consultar antes de comprar?",
    a: "¡Por supuesto! Contactanos por WhatsApp antes de hacer cualquier compra. Estamos para ayudarte a elegir el pack que mejor se adapta a lo que necesitás.",
  },
];

export default function Page() {
  // Modal state
  const [orderOpen, setOrderOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Selected pack
  const [isCustom, setIsCustom] = useState(false);
  const [pack, setPack] = useState("");
  const [price, setPrice] = useState("");
  const [cantidad, setCantidad] = useState(0);

  // Form fields
  const [customQty, setCustomQty] = useState("");
  const [salaInput, setSalaInput] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // UI flags
  const [navScrolled, setNavScrolled] = useState(false);
  const [aliasCopied, setAliasCopied] = useState(false);

  // Channel modal: se muestra una vez cada 3 días por browser
  useEffect(() => {
    const KEY = "cc_channel_shown";
    const DAYS = 3;
    const last = localStorage.getItem(KEY);
    const shouldShow = !last || Date.now() - Number(last) > DAYS * 86_400_000;
    if (!shouldShow) return;
    const t = setTimeout(() => {
      setChannelOpen(true);
      localStorage.setItem(KEY, String(Date.now()));
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Body scroll lock cuando hay modal abierto
  useEffect(() => {
    document.body.style.overflow = orderOpen || channelOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [orderOpen, channelOpen]);

  // Navbar scroll
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fade-in animations
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll(".fade-in").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function resetForm() {
    setCustomQty("");
    setSalaInput("");
    setWhatsapp("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSuccess(false);
    setSubmitError(null);
  }

  function openPackModal(packName: string, packPrice: string, packCantidad: number) {
    setIsCustom(false);
    setPack(packName);
    setPrice(packPrice);
    setCantidad(packCantidad);
    resetForm();
    setOrderOpen(true);
  }

  function openCustomModal() {
    setIsCustom(true);
    setPack("");
    setPrice("");
    setCantidad(0);
    resetForm();
    setOrderOpen(true);
  }

  function onCustomQtyChange(value: string) {
    setCustomQty(value);
    const qty = parseInt(value, 10) || 0;
    if (qty < 2000 || qty > 9999) {
      setPack("");
      setPrice("");
      setCantidad(0);
      return;
    }
    const calc = qty / 2;
    setPack(`${qty.toLocaleString("es-AR")} fichas (personalizado)`);
    setPrice(`$${calc.toLocaleString("es-AR")}`);
    setCantidad(qty);
  }

  function buildSala(): string {
    return salaInput.trim() ? `Sala${salaInput.trim()}` : "";
  }

  function copyAlias() {
    navigator.clipboard.writeText("0000003100036581418208").then(() => {
      setAliasCopied(true);
      setTimeout(() => setAliasCopied(false), 2000);
    });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    // Validar custom
    if (isCustom) {
      const qty = parseInt(customQty, 10) || 0;
      if (qty < 2000) {
        setSubmitError("La cantidad mínima es 2.000 fichas.");
        return;
      }
      if (qty > 9999) {
        setSubmitError("Para 10.000 o más fichas, usá los packs regulares (más económicos).");
        return;
      }
    }

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setSubmitError("Tenés que adjuntar el comprobante de pago.");
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append("pack", pack);
    fd.append("cantidad", String(cantidad));
    fd.append("precio", price);
    fd.append("sala", buildSala());
    fd.append("whatsapp", whatsapp.trim());
    fd.append("comprobante", file);

    try {
      const res = await fetch("/api/pedidos", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `status ${res.status}`);
      }
      setSuccess(true);
    } catch (err) {
      console.error("submitOrder:", err);
      setSubmitError("Hubo un error al enviar. Intentá de nuevo en unos segundos.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleFaq(i: number) {
    setOpenFaq(openFaq === i ? null : i);
  }

  return (
    <>
      {/* NAV */}
      <nav className={`nav${navScrolled ? " scrolled" : ""}`}>
        <a className="nav-logo" href="#">
          <img src="/logo.png" alt="Publicidad Creativa" />
        </a>
        <a className="nav-cta" href="#packs">
          Ver Packs
        </a>
      </nav>

      {/* HERO */}
      <section className="hero" id="inicio">
        <div className="hero-bg" />
        <div className="hero-orb hero-orb-1" aria-hidden="true" />
        <div className="hero-orb hero-orb-2" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <span aria-hidden="true">🔒</span>
              <span>Compra 100% segura y garantizada</span>
            </div>
            <h1 className="hero-title">
              ¡Bienvenido!
              <br />
              Elegí el <span className="hl">pack</span> que quieras.
            </h1>
            <p className="hero-sub">
              Cada pack está listo para ser entregado. Tu compra queda registrada y nosotros nos
              ocupamos del resto.
            </p>
            <div className="hero-cta-row">
              <a className="btn-primary" href="#como-funciona">
                ¿Cómo funciona?
              </a>
              <a className="btn-ghost" href="#packs">
                🛒 Ver los packs
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/logo.png" alt="Publicidad Creativa" />
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar fade-in">
        <div className="trust-bar-inner">
          <div className="trust-item">
            <span className="trust-item-icon" aria-hidden="true">🔒</span>
            <span>Pago seguro</span>
          </div>
          <div className="trust-item">
            <span className="trust-item-icon" aria-hidden="true">⚡</span>
            <span>Entrega rápida</span>
          </div>
          <div className="trust-item">
            <span className="trust-item-icon" aria-hidden="true">✅</span>
            <span>Satisfacción garantizada</span>
          </div>
        </div>
      </div>

      {/* PASOS */}
      <section id="como-funciona">
        <div className="inner">
          <header
            className="section-hdr center-hdr fade-in"
            style={{ maxWidth: 520, margin: "0 auto 56px" }}
          >
            <span className="section-tag">El proceso</span>
            <h2 className="section-title">Comprá en 3 pasos</h2>
            <p className="section-sub">Simple, rápido y sin complicaciones.</p>
          </header>
          <div className="steps-grid">
            <div className="step-card fade-in">
              <div className="step-num">1</div>
              <h3 className="step-title">Elegí tu pack</h3>
              <p className="step-desc">
                Navegá por los packs disponibles y hacé click en el que más te conviene.
              </p>
            </div>
            <div className="step-card fade-in">
              <div className="step-num">2</div>
              <h3 className="step-title">Completá el formulario</h3>
              <p className="step-desc">
                Ingresá tus datos de entrega y adjuntá el comprobante de pago.
              </p>
            </div>
            <div className="step-card fade-in">
              <div className="step-num">3</div>
              <h3 className="step-title">Recibís tu pedido</h3>
              <p className="step-desc">
                Confirmamos el pago, preparamos tu pack y coordinamos la entrega con vos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PACKS */}
      <section className="packs-section" id="packs">
        <div className="inner">
          <header className="section-hdr center-hdr fade-in">
            <span className="section-tag">Nuestros packs</span>
            <h2 className="section-title">Elegí el tuyo</h2>
            <p className="section-sub">
              Cada pack incluye todo lo que necesitás. Seleccioná el que mejor se adapta a vos.
            </p>
          </header>
          <div className="packs-grid">
            <div className="pack-card featured fade-in">
              <h3 className="pack-name">Tabla de fichas</h3>
              <div className="price-table">
                <div className="note">Precios por cantidad (ARS)</div>
                <div className="price-grid" role="list">
                  {PRICE_ITEMS.map((p) => (
                    <div
                      key={p.cantidad}
                      className={`price-item${p.recommended ? " recommended" : ""}`}
                      role="listitem"
                    >
                      <div>
                        <div className="tier">{p.tier}</div>
                        <div className="amount">
                          {p.price} <span className="currency">ARS</span>
                        </div>
                      </div>
                      <div className="buy">
                        <button
                          className="btn-pack"
                          onClick={() => openPackModal(p.tier.replace("✅ ", ""), p.price, p.cantidad)}
                        >
                          Comprar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Banner cantidad personalizada */}
                <div className="custom-amount">
                  <div className="custom-amount-info">
                    <span className="custom-amount-icon" aria-hidden="true">🎰</span>
                    <div>
                      <div className="custom-amount-title">¿Querés menos de 10.000 fichas?</div>
                      <div className="custom-amount-desc">
                        Mínimo 2.000 fichas · $0,50 por ficha (ej: 2.000 = $1.000)
                      </div>
                    </div>
                  </div>
                  <button type="button" className="custom-amount-btn" onClick={openCustomModal}>
                    Comprar cantidad personalizada
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIANZA */}
      <section id="confianza">
        <div className="inner">
          <header
            className="section-hdr center-hdr fade-in"
            style={{ maxWidth: 600, margin: "0 auto 60px" }}
          >
            <span className="section-tag">Por qué elegirnos</span>
            <h2 className="section-title">Tu tranquilidad es nuestra prioridad</h2>
            <p className="section-sub">
              Entendemos que hacer una transferencia requiere confianza. Por eso lo hacemos simple
              y transparente.
            </p>
          </header>
          <div className="trust-grid">
            <div className="trust-feat fade-in">
              <span className="trust-feat-icon" aria-hidden="true">🔐</span>
              <h3 className="trust-feat-title">Pago 100% seguro</h3>
              <p className="trust-feat-desc">
                Tu transferencia está protegida. Trabajamos con medios de pago verificados y tu
                información nunca se comparte con terceros.
              </p>
            </div>
            <div className="trust-feat fade-in">
              <span className="trust-feat-icon" aria-hidden="true">🪙</span>
              <h3 className="trust-feat-title">Acreditamos tus fichas</h3>
              <p className="trust-feat-desc">
                Una vez confirmada la transferencia, acreditamos las fichas en tu sala lo antes
                posible. Sin demoras ni vueltas.
              </p>
            </div>
            <div className="trust-feat fade-in">
              <span className="trust-feat-icon" aria-hidden="true">💬</span>
              <h3 className="trust-feat-title">Siempre disponibles</h3>
              <p className="trust-feat-desc">
                Ante cualquier duda, estamos a un mensaje. Respondemos rápido y sin vueltas por
                WhatsApp.
              </p>
            </div>
            <div className="trust-feat fade-in">
              <span className="trust-feat-icon" aria-hidden="true">✅</span>
              <h3 className="trust-feat-title">Satisfacción garantizada</h3>
              <p className="trust-feat-desc">
                Si algo no está bien, lo resolvemos. Así de simple. Tu experiencia nos importa más
                que cualquier otra cosa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="inner">
          <header
            className="section-hdr center-hdr fade-in"
            style={{ maxWidth: 560, margin: "0 auto 60px" }}
          >
            <span className="section-tag">Preguntas frecuentes</span>
            <h2 className="section-title">¿Tenés dudas?</h2>
          </header>
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <div key={i} className={`faq-item fade-in${openFaq === i ? " open" : ""}`}>
                <button className="faq-q" onClick={() => toggleFaq(i)}>
                  {f.q}
                  <span className="faq-arrow">▼</span>
                </button>
                <div className="faq-a">
                  <div className="faq-a-inner">{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section fade-in">
        <div className="inner" style={{ textAlign: "center", maxWidth: 620, margin: "0 auto" }}>
          <span className="section-tag">¿Listo?</span>
          <h2 className="section-title">Empezá ahora mismo</h2>
          <p className="section-sub" style={{ margin: "0 auto 40px" }}>
            No esperes más. Elegí tu pack, pagá con total confianza y nosotros nos ocupamos del
            resto.
          </p>
          <a
            className="btn-primary"
            href="#packs"
            style={{ fontSize: "1.05rem", padding: "18px 42px" }}
          >
            🛒 Ver los packs
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <p className="footer-logo">✦ Casi Creativos</p>
        <p className="footer-copy">© 2025 Casi Creativos — Todos los derechos reservados.</p>
      </footer>

      {/* WA FLOAT */}
      <a
        className="wa-float"
        href="https://wa.me/5492944239107?text=Hola%2C%20quiero%20consultar%20sobre%20los%20packs%20de%20fichas%20%F0%9F%93%A6"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
      >
        <div className="wa-btn">
          <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
            <path fill="#fff" d={WA_PATH} />
          </svg>
        </div>
      </a>

      {/* MODAL CANAL WHATSAPP — bloqueante */}
      <div className={`modal-overlay${channelOpen ? " open" : ""}`}>
        <div className="modal" style={{ maxWidth: 440, textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 14 }}>📢</div>
          <h2 className="modal-title" style={{ textAlign: "center" }}>
            Sumate a nuestro canal
          </h2>
          <p className="modal-sub" style={{ textAlign: "center", marginBottom: 24 }}>
            Para acceder a los packs, primero unite a nuestro canal de WhatsApp. Ahí publicamos
            promos, novedades y nuevos packs.
          </p>
          <a
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              background: "linear-gradient(135deg,#25d366,#128c7e)",
            }}
            href="https://whatsapp.com/channel/0029VaxKnbcHwXbFyqkWmh1o"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setChannelOpen(false)}
          >
            <svg
              viewBox="0 0 32 32"
              width="20"
              height="20"
              aria-hidden="true"
              style={{ marginRight: 4 }}
            >
              <path fill="#fff" d={WA_PATH} />
            </svg>
            Unirme al canal
          </a>
        </div>
      </div>

      {/* MODAL PEDIDO */}
      <div
        className={`modal-overlay${orderOpen ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOrderOpen(false);
        }}
      >
        <div className="modal">
          <button
            className="modal-close"
            onClick={() => setOrderOpen(false)}
            aria-label="Cerrar"
          >
            ✕
          </button>

          {!success ? (
            <div>
              <h2 className="modal-title">Confirmar pedido</h2>
              <p className="modal-sub">Completá tus datos y adjuntá el comprobante.</p>
              <div className="modal-pack-tag">
                {isCustom
                  ? cantidad >= 2000 && cantidad <= 9999
                    ? `🎰 ${pack} — ${price} ARS`
                    : customQty && parseInt(customQty, 10) > 9999
                      ? "⚠️ Para 10.000 o más, usá los packs regulares"
                      : "🎰 Cantidad personalizada — ingresá cuántas fichas querés"
                  : `📦 ${pack} — ${price} ARS`}
              </div>

              {/* CBU */}
              <div className="alias-box">
                <div>
                  <p className="alias-label">Transferí al CBU</p>
                  <p className="alias-value">0000003100036581418208</p>
                  <p className="alias-holder">A nombre de Kimberly Julissa Marroquin Licardi</p>
                </div>
                <button type="button" className="alias-copy" onClick={copyAlias}>
                  {aliasCopied ? "¡Copiado!" : "Copiar CBU"}
                </button>
              </div>

              <form onSubmit={onSubmit}>
                {isCustom && (
                  <div className="form-grp">
                    <label className="form-lbl" htmlFor="inp-cantidad">
                      Cantidad de fichas
                    </label>
                    <input
                      className="form-inp"
                      id="inp-cantidad"
                      type="number"
                      min={2000}
                      max={9999}
                      step={100}
                      placeholder="Ej: 2500"
                      value={customQty}
                      onChange={(e) => onCustomQtyChange(e.target.value)}
                    />
                    <p className="form-hint">
                      Mínimo 2.000 · Máximo 9.999 · $0,50 por ficha
                    </p>
                  </div>
                )}
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="inp-sala">
                    Sala
                  </label>
                  <input
                    className="form-inp"
                    id="inp-sala"
                    type="text"
                    placeholder="Ej: Victor (se enviará como SalaVictor)"
                    value={salaInput}
                    onChange={(e) => setSalaInput(e.target.value)}
                    required
                  />
                </div>
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="inp-wa">
                    WhatsApp (con código de área)
                  </label>
                  <input
                    className="form-inp"
                    id="inp-wa"
                    type="tel"
                    placeholder="Ej: 11 2345-6789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                  />
                  <p className="form-hint">
                    Te avisamos por acá cuando se acrediten tus fichas.
                  </p>
                </div>
                <div className="form-grp">
                  <label className="form-lbl">Comprobante de pago</label>
                  <label
                    className="file-drop"
                    style={fileName ? { borderColor: "var(--green)" } : undefined}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={onFileChange}
                    />
                    {fileName ? (
                      <>
                        <span className="file-drop-icon" aria-hidden="true">✅</span>
                        <p
                          className="file-drop-text"
                          style={{ color: "var(--green-light)", fontWeight: 700 }}
                        >
                          {fileName}
                        </p>
                        <p className="file-drop-hint">Click para cambiar</p>
                      </>
                    ) : (
                      <>
                        <span className="file-drop-icon" aria-hidden="true">📎</span>
                        <p className="file-drop-text">Adjuntá el comprobante de transferencia</p>
                        <p className="file-drop-hint">Imagen o PDF · click para seleccionar</p>
                      </>
                    )}
                  </label>
                </div>
                {submitError && (
                  <p
                    style={{
                      color: "#f87171",
                      fontSize: "0.82rem",
                      textAlign: "center",
                      marginTop: 12,
                    }}
                  >
                    {submitError}
                  </p>
                )}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setOrderOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-confirm" disabled={submitting}>
                    {submitting ? "Enviando..." : "Enviar pedido 🚀"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="modal-success show">
              <div className="success-icon">🎉</div>
              <h2 className="success-title">¡Compra realizada con éxito!</h2>
              <p className="success-desc">
                Recibimos tu pedido junto con el comprobante. En breve acreditamos tus fichas.
              </p>
              <div className="success-note">
                <span aria-hidden="true">🔄</span>
                <span>
                  Cuando se acrediten tus fichas, <strong>actualizá la página</strong> para que se
                  reflejen.
                </span>
              </div>
              <button
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                onClick={() => setOrderOpen(false)}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
