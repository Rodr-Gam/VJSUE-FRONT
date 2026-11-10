import { useState, useEffect } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../layouts/AdminLayout";

import { packageService } from "../../../packageService";

import PackageGalleryManager from "../../../components/packages/PackageGalleryManager";

import "../../../styles/VerReserva.css";
import "../../../styles/QuickReservation.css";
import "../../../styles/PackageAdminForm.css";

import {

  PackageIcon,

  RefreshCcwIcon,

  ArrowBigLeftIcon,

  CircleDollarSign,

  ImageIcon,

  Users,

} from "lucide-react";

import {

  getMainImageUrl,

  parsePackageApiError,

  validatePackageImageFile,

} from "../../../utils/packageImages";

import { PACKAGE_IMAGE_ACCEPT } from "../../../types/package";

import { toDateInputValue, validateTripDates } from "../../../utils/packageDates";

import PackagePriceBreakdownFields, {
  getPackagePriceBreakdownError,
} from "../../../components/Admin/packages/PackageInfoPriceFields";
import ServiceFinanceFields from "../../../components/Admin/ServiceFinanceFields";
import {
  calcSupplierPaymentFromPlatformCost,
  normalizePlatformProfitPercent,
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



export default function EditarPaquete() {

  const { id } = useParams();

  const navigate = useNavigate();

  const packageId = Number(id);



  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [status, setStatus] = useState("active");

  const [cityId, setCityId] = useState("");

  const [duration, setDuration] = useState("");

  const [departureDate, setDepartureDate] = useState("");

  const [returnDate, setReturnDate] = useState("");

  const [stock, setStock] = useState("");

  const [quotaAdults, setQuotaAdults] = useState(0);

  const [quotaJuniors, setQuotaJuniors] = useState(0);

  const [quotaChildren, setQuotaChildren] = useState(0);

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

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [reservedSeatsTotal, setReservedSeatsTotal] = useState<number | null>(null);


  const [carouselImages, setCarouselImages] = useState<PackageImage[]>([]);



  const [cities, setCities] = useState<City[]>([]);

  const [loading, setLoading] = useState(false);

  const [loadingData, setLoadingData] = useState(true);

  const [mensaje, setMensaje] = useState<{

    texto: string;

    tipo: "success" | "error";

  } | null>(null);



  const cargarDatosPaquete = async () => {

    if (!id) return;

    const pkg = await packageService.getPackageById(packageId);

    setName(pkg.name || "");

    setDescription(pkg.description || "");

    setStatus(pkg.status || "active");

    setCityId(pkg.city_id ? String(pkg.city_id) : "");

    setDuration(pkg.duration || "");

    setDepartureDate(toDateInputValue(pkg.departure_date));

    setReturnDate(toDateInputValue(pkg.return_date));

    const stockNum = pkg.stock != null ? Number(pkg.stock) : 0;
    setStock(String(stockNum));

    setQuotaAdults(
      pkg.quota_adults != null ? Number(pkg.quota_adults) : stockNum,
    );
    setQuotaJuniors(
      pkg.quota_juniors != null ? Number(pkg.quota_juniors) : 0,
    );
    setQuotaChildren(
      pkg.quota_children != null ? Number(pkg.quota_children) : 0,
    );

    setPriceAdult(pkg.price_adult != null ? String(pkg.price_adult) : "");

    setPriceJunior(pkg.price_junior != null ? String(pkg.price_junior) : "");

    setPriceChild(pkg.price_child != null ? String(pkg.price_child) : "");

    setPackageTotalCost(
      pkg.package_total_cost != null ? String(pkg.package_total_cost) : "",
    );

    setPlatformProfitPercent(
      normalizePlatformProfitPercent(pkg.platform_profit_percent),
    );

    setClientCost(
      pkg.client_cost != null && pkg.client_cost !== ""
        ? String(pkg.client_cost)
        : "",
    );
    setSupplierPayment(
      pkg.supplier_payment != null && pkg.supplier_payment !== ""
        ? String(pkg.supplier_payment)
        : pkg.provider_cost != null && pkg.provider_cost !== ""
          ? String(pkg.provider_cost)
          : "",
    );
    setBonusDiscount(
      pkg.bonus_discount != null && pkg.bonus_discount !== ""
        ? String(pkg.bonus_discount)
        : "",
    );
    setBonusDiscountNote(pkg.bonus_discount_note ?? "");

    setReservedSeatsTotal(pkg.reserved_seats_total ?? null);

    const mainUrl =

      getMainImageUrl(pkg.image_path) || pkg.image_url || null;

    setImagePreview(mainUrl);

    setCarouselImages(pkg.images ?? []);

  };



  const cargarTodo = async () => {

    try {

      setLoadingData(true);

      const ciudadesData = await packageService.getCities();

      setCities(unwrapCities(ciudadesData));

      await cargarDatosPaquete();

    } catch (error) {

      console.error("Error al cargar:", error);

      setMensaje({ texto: parsePackageApiError(error), tipo: "error" });

    } finally {

      setLoadingData(false);

    }

  };



  useEffect(() => {

    cargarTodo();

  }, [id]);

  useEffect(() => {
    const pay = calcSupplierPaymentFromPlatformCost(
      packageTotalCost,
      platformProfitPercent,
    );
    setSupplierPayment(pay !== null ? pay.toFixed(2) : "");
  }, [packageTotalCost, platformProfitPercent]);

  const passengerCounts = {
    adults: quotaAdults,
    juniors: quotaJuniors,
    children: quotaChildren,
  };
  const totalQuota = quotaAdults + quotaJuniors + quotaChildren;

  useEffect(() => {
    if (totalQuota > 0) {
      setStock(String(totalQuota));
    }
  }, [quotaAdults, quotaJuniors, quotaChildren, totalQuota]);

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

    const dateError = validateTripDates(departureDate, returnDate);

    if (dateError) {

      setMensaje({ texto: dateError, tipo: "error" });

      return;

    }

    if (totalQuota < 1) {
      setMensaje({
        texto: "Indica al menos un cupo (adulto, juvenil o niño).",
        tipo: "error",
      });
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

    formData.append("quota_adults", String(quotaAdults));

    formData.append("quota_juniors", String(quotaJuniors));

    formData.append("quota_children", String(quotaChildren));

    formData.append("adults", String(quotaAdults));

    formData.append("juniors", String(quotaJuniors));

    formData.append("children", String(quotaChildren));

    formData.append("price_adult", priceAdult);

    formData.append("price_junior", priceJunior);

    formData.append("price_child", priceChild);

    formData.append("package_total_cost", packageTotalCost.trim());

    formData.append("platform_profit_percent", String(platformProfitPercent));

    formData.append("provider_cost", supplierPayment.trim() || "");
    formData.append("client_cost", clientCost.trim() || "");
    formData.append("supplier_payment", supplierPayment.trim() || "");
    formData.append("bonus_discount", bonusDiscount.trim() || "");
    formData.append("bonus_discount_note", bonusDiscountNote.trim() || "");

    if (image) formData.append("image", image);

    formData.append("_method", "PUT");



    try {

      await packageService.updatePackage(packageId, formData);

      setMensaje({ texto: "Paquete actualizado con éxito.", tipo: "success" });

      await cargarDatosPaquete();

      setImage(null);

      setTimeout(() => navigate("/admin/paquetes"), 1500);

    } catch (error: unknown) {

      setMensaje({ texto: parsePackageApiError(error), tipo: "error" });

    } finally {

      setLoading(false);

    }

  };



  if (loadingData) {

    return (

      <AdminLayout>

        <div className="flex items-center justify-center h-screen">

          <div className="flex flex-col items-center gap-4">

            <PackageIcon size={48} className="text-[#d3a762] animate-bounce" />

            <p className="text-[#d3a762] font-semibold text-lg tracking-wide uppercase">

              Cargando paquete...

            </p>

          </div>

        </div>

      </AdminLayout>

    );

  }



  return (

    <AdminLayout>

      <div className="qr-page pkg-form-page">

        <div className="R-dashboard-cards">

          <div className="flex-1">

            <div className="R-card-tt">

              <h2 className="R-dashboard-title">Editar paquete</h2>

              <p className="qr-hero-sub">

                Actualiza datos del viaje, precios oficiales y márgenes comerciales.

              </p>

            </div>



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

                    className="R-input"

                    value={name}

                    onChange={(e) => setName(e.target.value)}

                  />

                </label>



                <label className="R-label">

                  Estado

                  <select

                    className="R-input"

                    value={status}

                    onChange={(e) => setStatus(e.target.value)}

                  >

                    <option value="active">Activo</option>

                    <option value="inactive">Inactivo</option>

                  </select>

                </label>



                <label className="R-label">

                  Ciudad destino

                  <select

                    className="R-input"

                    value={cityId}

                    onChange={(e) => setCityId(e.target.value)}

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

                    className="R-input"

                    value={duration}

                    onChange={(e) => setDuration(e.target.value)}

                  />

                </label>



                <label className="R-label">

                  Salida del viaje

                  <input

                    type="date"

                    className="R-input"

                    value={departureDate}

                    onChange={(e) => setDepartureDate(e.target.value)}

                  />

                </label>



                <label className="R-label">

                  Regreso del viaje

                  <input

                    type="date"

                    className="R-input"

                    value={returnDate}

                    min={departureDate || undefined}

                    onChange={(e) => setReturnDate(e.target.value)}

                  />

                </label>



                <label className="R-label">

                  Cupos totales

                  <input

                    type="number"

                    min="1"

                    className="R-input"

                    value={stock}

                    readOnly

                  />

                  <span className="pkg-field-hint">

                    Suma automática de cupos por edad (abajo).

                  </span>

                  {reservedSeatsTotal !== null && (
                    <span className="pkg-reserved-hint">
                      {reservedSeatsTotal} lugares ya reservados actualmente
                    </span>
                  )}

                </label>

                    </div>

                    <div className="qr-subpanel pkg-passengers-capacity">

                      <div className="qr-section-head qr-section-head--compact">

                        <span className="qr-section-icon" aria-hidden="true">

                          <Users size={18} />

                        </span>

                        <div>

                          <h3 className="qr-subpanel-title">Cupos por edad</h3>

                          <p className="qr-section-desc">

                            Define cuántos lugares hay por adulto, juvenil y

                            niño. Si el precio juvenil o de niño es $0, el

                            cliente no verá esa categoría al reservar.

                          </p>

                        </div>

                      </div>

                      <div className="qr-grid qr-grid--3">

                        <label className="R-label">

                          Cupo adultos

                          <input

                            type="number"

                            min="0"

                            className="R-input"

                            value={quotaAdults}

                            onChange={(e) => {

                              setMensaje(null);

                              setQuotaAdults(

                                Math.max(0, Number(e.target.value) || 0),

                              );

                            }}

                          />

                        </label>

                        <label className="R-label">

                          Cupo juvenil

                          <input

                            type="number"

                            min="0"

                            className="R-input"

                            value={quotaJuniors}

                            onChange={(e) => {

                              setMensaje(null);

                              setQuotaJuniors(

                                Math.max(0, Number(e.target.value) || 0),

                              );

                            }}

                          />

                        </label>

                        <label className="R-label">

                          Cupo niño

                          <input

                            type="number"

                            min="0"

                            className="R-input"

                            value={quotaChildren}

                            onChange={(e) => {

                              setMensaje(null);

                              setQuotaChildren(

                                Math.max(0, Number(e.target.value) || 0),

                              );

                            }}

                          />

                        </label>

                      </div>

                    </div>

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

                      onPackageTotalCostChange={setPackageTotalCost}

                      priceAdult={priceAdult}

                      onPriceAdultChange={setPriceAdult}

                      priceJunior={priceJunior}

                      onPriceJuniorChange={setPriceJunior}

                      priceChild={priceChild}

                      onPriceChildChange={setPriceChild}

                      platformProfitPercent={platformProfitPercent}

                      onPlatformProfitPercentChange={setPlatformProfitPercent}

                      passengerCounts={passengerCounts}

                      disabled={loading}

                    />



                    <div className="qr-commercial-block">

                      <h3 className="qr-subpanel-title">Cobro, pagos y ganancia</h3>

                      <ServiceFinanceFields

                        clientCost={clientCost}

                        onClientCostChange={setClientCost}

                        supplierPayment={supplierPayment}

                        onSupplierPaymentChange={setSupplierPayment}

                        bonusDiscount={bonusDiscount}

                        onBonusDiscountChange={setBonusDiscount}

                        bonusDiscountNote={bonusDiscountNote}

                        onBonusDiscountNoteChange={setBonusDiscountNote}

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

                    className="R-input"

                    onChange={(e) => setImage(e.target.files?.[0] || null)}

                  />

                </label>



                {imagePreview && (

                  <div className="R-label pkg-cover-preview">

                    Portada actual

                    <img src={imagePreview} alt="Portada" />

                  </div>

                )}



                <label className="R-label qr-grid-span-full">

                  Descripción

                  <textarea

                    className="R-textarea"

                    rows={3}

                    value={description}

                    onChange={(e) => setDescription(e.target.value)}

                  />

                </label>

                </div>

              </section>



              <div className="qr-form-actions qr-form-actions--split">

                <Link to="/admin/paquetes" className="qr-btn-ghost">

                  <ArrowBigLeftIcon size={18} />

                  Regresar

                </Link>

                <button type="submit" className="qr-submit" disabled={loading}>

                  <RefreshCcwIcon size={18} />

                  {loading ? "Actualizando..." : "Actualizar paquete"}

                </button>

              </div>

            </form>



            <section className="R-card-f pkg-gallery-card">

              <div className="qr-section-head qr-section-head--compact">

                <span className="qr-section-icon" aria-hidden="true">

                  <ImageIcon size={18} />

                </span>

                <div>

                  <h2 className="qr-section-title">Galería del paquete</h2>

                  <p className="qr-section-desc">

                    Imágenes adicionales para el carrusel en el sitio público.

                  </p>

                </div>

              </div>



              <PackageGalleryManager

                packageId={packageId}

                images={carouselImages}

                onImagesUpdated={setCarouselImages}

              />

            </section>

          </div>

        </div>

      </div>

    </AdminLayout>

  );

}


