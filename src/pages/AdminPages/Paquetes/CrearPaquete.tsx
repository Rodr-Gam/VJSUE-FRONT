import { useState, useEffect } from "react";

import AdminLayout from "../../../layouts/AdminLayout";

import { packageService } from "../../../packageService";

import PackageGalleryManager from "../../../components/packages/PackageGalleryManager";

import "../../../styles/VerReserva.css";
import "../../../styles/QuickReservation.css";
import "../../../styles/PackageAdminForm.css";

import {
  SaveAllIcon,
  PackageIcon,
  CircleDollarSign,
  ImageIcon,
  Users,
} from "lucide-react";

import {

  parsePackageApiError,

  validatePackageImageFile,

} from "../../../utils/packageImages";

import { PACKAGE_IMAGE_ACCEPT } from "../../../types/package";

import { validateTripDates } from "../../../utils/packageDates";

import PackagePriceBreakdownFields, {
  getPackagePriceBreakdownError,
} from "../../../components/Admin/packages/PackageInfoPriceFields";
import ServiceFinanceFields from "../../../components/Admin/ServiceFinanceFields";
import {
  calcSupplierPaymentFromPlatformCost,
  type PlatformProfitPercent,
} from "../../../utils/packageInfoPricing";

import type { PackageImage } from "../../../types/package";



interface City {

  id: number;

  name: string;

}



function unwrapCities(response: unknown): City[] {

  if (Array.isArray(response)) return response;

  if (response && typeof response === "object") {

    const obj = response as Record<string, unknown>;

    if (Array.isArray(obj.cities)) return obj.cities as City[];

    if (Array.isArray(obj.data)) return obj.data as City[];

  }

  return [];

}



export default function CrearPaquete() {

  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [status, setStatus] = useState("active");

  const [cityId, setCityId] = useState("");

  const [duration, setDuration] = useState("");

  const [departureDate, setDepartureDate] = useState("");

  const [returnDate, setReturnDate] = useState("");

  const [stock, setStock] = useState("");

  const [adults, setAdults] = useState(0);

  const [juniors, setJuniors] = useState(0);

  const [children, setChildren] = useState(0);

  const [priceAdult, setPriceAdult] = useState("");

  const [priceJunior, setPriceJunior] = useState("");

  const [priceChild, setPriceChild] = useState("");

  const [packageTotalCost, setPackageTotalCost] = useState("");

  const [platformProfitPercent, setPlatformProfitPercent] =
    useState<PlatformProfitPercent>(17);

  const [clientCost, setClientCost] = useState("");
  const [supplierPayment, setSupplierPayment] = useState("");
  const [bonusDiscount, setBonusDiscount] = useState("");
  const [bonusDiscountNote, setBonusDiscountNote] = useState("");

  const [image, setImage] = useState<File | null>(null);



  const [createdPackageId, setCreatedPackageId] = useState<number | null>(null);

  const [carouselImages, setCarouselImages] = useState<PackageImage[]>([]);



  const [cities, setCities] = useState<City[]>([]);

  const [loading, setLoading] = useState(false);

  const [mensaje, setMensaje] = useState<{

    texto: string;

    tipo: "success" | "error";

  } | null>(null);



  useEffect(() => {

    packageService

      .getCities()

      .then((data) => setCities(unwrapCities(data)))

      .catch(() =>

        setMensaje({ texto: "No se pudieron cargar las ciudades.", tipo: "error" }),

      );

  }, []);

  useEffect(() => {
    const pay = calcSupplierPaymentFromPlatformCost(
      packageTotalCost,
      platformProfitPercent,
    );
    setSupplierPayment(pay !== null ? pay.toFixed(2) : "");
  }, [packageTotalCost, platformProfitPercent]);

  const passengerCounts = { adults, juniors, children };
  const totalPassengers = adults + juniors + children;

  useEffect(() => {
    if (totalPassengers > 0) {
      setStock(String(totalPassengers));
    }
  }, [adults, juniors, children, totalPassengers]);

  const resetForm = () => {

    setName("");

    setDescription("");

    setStatus("active");

    setCityId("");

    setDuration("");

    setDepartureDate("");

    setReturnDate("");

    setStock("");

    setAdults(0);

    setJuniors(0);

    setChildren(0);

    setPriceAdult("");

    setPriceJunior("");

    setPriceChild("");

    setPackageTotalCost("");

    setPlatformProfitPercent(17);

    setClientCost("");

    setSupplierPayment("");

    setBonusDiscount("");

    setBonusDiscountNote("");

    setImage(null);

  };



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();



    if (!name.trim()) {

      setMensaje({ texto: "El nombre del paquete es requerido.", tipo: "error" });

      return;

    }

    if (!cityId) {

      setMensaje({ texto: "Selecciona un destino.", tipo: "error" });

      return;

    }

    if (!duration.trim() || !departureDate || !returnDate) {

      setMensaje({ texto: "Completa duración, salida y regreso.", tipo: "error" });

      return;

    }

    if (totalPassengers < 1) {

      setMensaje({

        texto: "Indica al menos un pasajero (adulto, junior o niño) para definir el cupo.",

        tipo: "error",

      });

      return;

    }

    if (!stock || Number(stock) < 1) {

      setMensaje({ texto: "Los cupos disponibles deben ser al menos 1.", tipo: "error" });

      return;

    }

    const dateError = validateTripDates(departureDate, returnDate);

    if (dateError) {

      setMensaje({ texto: dateError, tipo: "error" });

      return;

    }

    const priceBreakdownError = getPackagePriceBreakdownError(
      {
        packageTotalCost,
        priceAdult,
        priceJunior,
        priceChild,
        passengerCounts,
      },
      true,
    );

    if (priceBreakdownError) {
      setMensaje({ texto: priceBreakdownError, tipo: "error" });
      return;
    }

    if (image) {

      const imageError = validatePackageImageFile(image);

      if (imageError) {

        setMensaje({ texto: imageError, tipo: "error" });

        return;

      }

    }



    setLoading(true);

    setMensaje(null);



    const formData = new FormData();

    formData.append("name", name.trim());

    formData.append("description", description.trim());

    formData.append("status", status);

    formData.append("city_id", cityId);

    formData.append("duration", duration.trim());

    formData.append("departure_date", departureDate);

    formData.append("return_date", returnDate);

    formData.append("stock", stock);

    formData.append("adults", String(adults));

    formData.append("juniors", String(juniors));

    formData.append("children", String(children));

    formData.append("quota_adults", String(adults));

    formData.append("quota_juniors", String(juniors));

    formData.append("quota_children", String(children));

    formData.append("price_adult", priceAdult);

    formData.append("price_junior", priceJunior);

    formData.append("price_child", priceChild);

    if (packageTotalCost.trim()) {
      formData.append("package_total_cost", packageTotalCost.trim());
    }

    formData.append("platform_profit_percent", String(platformProfitPercent));

    if (supplierPayment.trim()) {
      formData.append("provider_cost", supplierPayment);
    }
    if (clientCost.trim()) formData.append("client_cost", clientCost);
    if (supplierPayment.trim()) formData.append("supplier_payment", supplierPayment);
    if (bonusDiscount.trim()) formData.append("bonus_discount", bonusDiscount);
    if (bonusDiscountNote.trim()) {
      formData.append("bonus_discount_note", bonusDiscountNote.trim());
    }

    if (image) formData.append("image", image);



    try {

      const data = await packageService.createPackage(formData);

      const newId = data.package?.id;



      if (!newId) {

        setMensaje({

          texto: "Paquete creado, pero no se recibió el ID para la galería.",

          tipo: "error",

        });

        return;

      }



      setCreatedPackageId(newId);

      setCarouselImages(data.package.images ?? []);

      resetForm();

      setMensaje({

        texto:

          data.message ||

          "Paquete creado con éxito. Ahora puedes subir imágenes al carrusel.",

        tipo: "success",

      });

    } catch (error: unknown) {

      setMensaje({ texto: parsePackageApiError(error), tipo: "error" });

    } finally {

      setLoading(false);

    }

  };



  const handleCreateAnother = () => {

    setCreatedPackageId(null);

    setCarouselImages([]);

    setMensaje(null);

  };



  return (

    <AdminLayout>

      <div className="qr-page pkg-form-page">

        <div className="R-dashboard-cards">

          <div className="flex-1">

            <div className="R-card-tt">

              <h2 className="R-dashboard-title">Nuevo paquete</h2>

              <p className="qr-hero-sub">

                Destino, fechas, costo en plataforma, reparto por edad y márgenes

                comerciales del paquete.

              </p>

            </div>



            {!createdPackageId ? (

              <form onSubmit={handleSubmit}>

                {mensaje && (

                  <div className={`cc-alert cc-alert--${mensaje.tipo}`}>

                    <span className="cc-alert-icon">

                      {mensaje.tipo === "success" ? "✓" : "!"}

                    </span>

                    <span>{mensaje.texto}</span>

                  </div>

                )}



                <section className="R-card-f">

                  <div className="qr-section-head">

                    <span className="qr-section-icon" aria-hidden="true">

                      <PackageIcon size={18} />

                    </span>

                    <div>

                      <h2 className="qr-section-title">Información general</h2>

                      <p className="qr-section-desc">

                        Nombre, destino, calendario del viaje y cupos disponibles.

                      </p>

                    </div>

                  </div>



                  <div className="qr-section-body">

                    <div className="qr-trip-panel">

                      <h3 className="qr-subpanel-title">Datos del paquete</h3>

                      <div className="qr-grid qr-grid--4">

                  <label className="R-label">

                    Nombre del paquete

                    <input

                      type="text"

                      value={name}

                      onChange={(e) => {

                        setMensaje(null);

                        setName(e.target.value);

                      }}

                      className="R-input"

                      placeholder="Ej. Escapada a Cancún"

                    />

                  </label>



                  <label className="R-label">

                    Estado

                    <select

                      value={status}

                      onChange={(e) => {

                        setMensaje(null);

                        setStatus(e.target.value);

                      }}

                      className="R-input"

                    >

                      <option value="active">Activo</option>

                      <option value="inactive">Inactivo</option>

                    </select>

                  </label>



                  <label className="R-label">

                    Ciudad destino

                    <select

                      value={cityId}

                      onChange={(e) => {

                        setMensaje(null);

                        setCityId(e.target.value);

                      }}

                      className="R-input"

                    >

                      <option value="">— Selecciona destino —</option>

                      {cities.map((c) => (

                        <option key={c.id} value={c.id}>

                          {c.name}

                        </option>

                      ))}

                    </select>

                  </label>



                  <label className="R-label">

                    Duración

                    <input

                      type="text"

                      value={duration}

                      onChange={(e) => {

                        setMensaje(null);

                        setDuration(e.target.value);

                      }}

                      className="R-input"

                      placeholder="Ej. 7 Días / 6 Noches"

                    />

                  </label>



                  <label className="R-label">

                    Salida del viaje

                    <input

                      type="date"

                      value={departureDate}

                      onChange={(e) => {

                        setMensaje(null);

                        setDepartureDate(e.target.value);

                      }}

                      className="R-input"

                    />

                  </label>



                  <label className="R-label">

                    Regreso del viaje

                    <input

                      type="date"

                      value={returnDate}

                      min={departureDate || undefined}

                      onChange={(e) => {

                        setMensaje(null);

                        setReturnDate(e.target.value);

                      }}

                      className="R-input"

                    />

                  </label>



                  <label className="R-label">

                    Cupos disponibles

                    <input

                      type="number"

                      min="1"

                      value={stock}

                      onChange={(e) => {

                        setMensaje(null);

                        setStock(e.target.value);

                      }}

                      className="R-input"

                      placeholder="Ej. 25"

                    />

                    <span className="pkg-field-hint">

                      Se actualiza con la suma de pasajeros; puedes ajustarlo si

                      el cupo es mayor.

                    </span>

                  </label>

                      </div>

                    </div>

                    <div className="qr-subpanel pkg-passengers-capacity">

                      <div className="qr-section-head qr-section-head--compact">

                        <span className="qr-section-icon" aria-hidden="true">

                          <Users size={18} />

                        </span>

                        <div>

                          <h3 className="qr-subpanel-title">Pasajeros</h3>

                          <p className="qr-section-desc">

                            Indica cuántos lugares ocupará cada tipo de pasajero

                            para calcular el cupo y validar precios por edad.

                          </p>

                        </div>

                      </div>

                      <div className="qr-grid qr-grid--3">

                        <label className="R-label">

                          Adultos

                          <input

                            type="number"

                            min="0"

                            className="R-input"

                            value={adults}

                            onChange={(e) => {

                              setMensaje(null);

                              setAdults(Math.max(0, Number(e.target.value) || 0));

                            }}

                          />

                        </label>

                        <label className="R-label">

                          Juvenil

                          <input

                            type="number"

                            min="0"

                            className="R-input"

                            value={juniors}

                            onChange={(e) => {

                              setMensaje(null);

                              setJuniors(Math.max(0, Number(e.target.value) || 0));

                            }}

                          />

                        </label>

                        <label className="R-label">

                          Niños

                          <input

                            type="number"

                            min="0"

                            className="R-input"

                            value={children}

                            onChange={(e) => {

                              setMensaje(null);

                              setChildren(Math.max(0, Number(e.target.value) || 0));

                            }}

                          />

                        </label>

                      </div>

                      {totalPassengers > 0 && (

                        <p className="pkg-passengers-total">

                          Total para cupo y precios:{" "}

                          <strong>{totalPassengers}</strong>{" "}

                          pasajero{totalPassengers === 1 ? "" : "s"}

                        </p>

                      )}

                    </div>

                  </div>

                </section>



                <section className="R-card-f">

                  <div className="qr-section-head">

                    <span className="qr-section-icon" aria-hidden="true">

                      <CircleDollarSign size={18} />

                    </span>

                    <div>

                      <h2 className="qr-section-title">Precios y márgenes</h2>

                      <p className="qr-section-desc">

                        Costo real en plataforma, reparto por edad y cobro al cliente.

                      </p>

                    </div>

                  </div>



                  <div className="qr-section-body">

                    <div className="qr-pricing-panel">

                      <PackagePriceBreakdownFields

                        packageTotalCost={packageTotalCost}

                        onPackageTotalCostChange={(v) => {

                          setMensaje(null);

                          setPackageTotalCost(v);

                        }}

                        priceAdult={priceAdult}

                        onPriceAdultChange={(v) => {

                          setMensaje(null);

                          setPriceAdult(v);

                        }}

                        priceJunior={priceJunior}

                        onPriceJuniorChange={(v) => {

                          setMensaje(null);

                          setPriceJunior(v);

                        }}

                        priceChild={priceChild}

                        onPriceChildChange={(v) => {

                          setMensaje(null);

                          setPriceChild(v);

                        }}

                        platformProfitPercent={platformProfitPercent}

                        onPlatformProfitPercentChange={(v) => {

                          setMensaje(null);

                          setPlatformProfitPercent(v);

                        }}

                        passengerCounts={passengerCounts}

                        disabled={loading}

                      />



                      <div className="qr-commercial-block">

                        <h3 className="qr-subpanel-title">Cobro, pagos y ganancia</h3>

                        <ServiceFinanceFields

                          clientCost={clientCost}

                          onClientCostChange={(v) => {

                            setMensaje(null);

                            setClientCost(v);

                          }}

                          supplierPayment={supplierPayment}

                          onSupplierPaymentChange={(v) => {

                            setMensaje(null);

                            setSupplierPayment(v);

                          }}

                          bonusDiscount={bonusDiscount}

                          onBonusDiscountChange={(v) => {

                            setMensaje(null);

                            setBonusDiscount(v);

                          }}

                          bonusDiscountNote={bonusDiscountNote}

                          onBonusDiscountNoteChange={(v) => {

                            setMensaje(null);

                            setBonusDiscountNote(v);

                          }}

                          disabled={loading}

                          supplierPaymentFromPlatform

                          platformProfitPercent={platformProfitPercent}

                        />

                      </div>

                    </div>

                  </div>

                </section>



                <section className="R-card-f">

                  <div className="qr-section-head">

                    <span className="qr-section-icon" aria-hidden="true">

                      <ImageIcon size={18} />

                    </span>

                    <div>

                      <h2 className="qr-section-title">Contenido y portada</h2>

                      <p className="qr-section-desc">

                        Imagen principal y descripción pública del paquete.

                      </p>

                    </div>

                  </div>



                  <div className="qr-section-body qr-media-panel">

                  <label className="R-label qr-file-input">

                    Imagen principal (portada)

                    <input

                      type="file"

                      accept={PACKAGE_IMAGE_ACCEPT}

                      onChange={(e) => {

                        setMensaje(null);

                        setImage(e.target.files?.[0] || null);

                      }}

                      className="R-input"

                    />

                  </label>



                  <label className="R-label qr-grid-span-full">

                    Descripción

                    <textarea

                      value={description}

                      rows={3}

                      className="R-textarea"

                      onChange={(e) => {

                        setMensaje(null);

                        setDescription(e.target.value);

                      }}

                      placeholder="Describe qué incluye el paquete..."

                    />

                  </label>

                  </div>

                </section>



                <div className="qr-form-actions">

                  <button

                    type="submit"

                    className="qr-submit"

                    disabled={loading}

                  >

                    <SaveAllIcon size={18} />

                    {loading ? "Guardando..." : "Guardar paquete"}

                  </button>

                </div>

              </form>

            ) : (

              <>

                {mensaje && (

                  <div className={`cc-alert cc-alert--${mensaje.tipo}`}>

                    <span className="cc-alert-icon">

                      {mensaje.tipo === "success" ? "✓" : "!"}

                    </span>

                    <span>{mensaje.texto}</span>

                  </div>

                )}



                <div className="R-card-f">

                  <div className="pkg-post-create-banner">

                    <p>

                      Paquete <strong>#{createdPackageId}</strong> creado. Administra

                      el carrusel de imágenes adicionales.

                    </p>

                    <button

                      type="button"

                      className="qr-submit"

                      onClick={handleCreateAnother}

                    >

                      Crear otro paquete

                    </button>

                  </div>



                  <PackageGalleryManager

                    packageId={createdPackageId}

                    images={carouselImages}

                    onImagesUpdated={setCarouselImages}

                  />

                </div>

              </>

            )}

          </div>

        </div>

      </div>

    </AdminLayout>

  );

}


