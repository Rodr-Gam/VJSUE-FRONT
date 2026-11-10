export default function ReservaSkeleton() {
  return (
    <div className="bp-skeleton" aria-hidden="true">
      <div className="bp-skeleton-body">
        <div className="bp-skeleton-line bp-skeleton-line--title" />
        <div className="bp-skeleton-line bp-skeleton-line--sub" />
        <div className="bp-skeleton-chips">
          <div className="bp-skeleton-chip" />
          <div className="bp-skeleton-chip" />
          <div className="bp-skeleton-chip" />
        </div>
        <div className="bp-skeleton-services">
          <div className="bp-skeleton-service" />
          <div className="bp-skeleton-service" />
          <div className="bp-skeleton-service" />
        </div>
      </div>
      <div className="bp-skeleton-coupon" />
    </div>
  );
}
