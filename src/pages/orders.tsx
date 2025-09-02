import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function OrdersPage() {
  return (
    <DefaultLayout>
      <div className="min-h-full bg-gradient-to-br from-green-50 to-emerald-50 -mx-6">
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
          <div className="inline-block max-w-lg text-center justify-center">
            <h1 className={title()}>Orders</h1>
          </div>
        </section>
      </div>
    </DefaultLayout>
  );
}
