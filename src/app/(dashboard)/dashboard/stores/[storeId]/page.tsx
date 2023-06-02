import type { Metadata } from "next"
import { revalidatePath } from "next/cache"
import { notFound, redirect } from "next/navigation"
import { db } from "@/db"
import { stores } from "@/db/schema"
import { and, eq, not } from "drizzle-orm"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"
import { Textarea } from "@/components/ui/textarea"
import { StoreTabs } from "@/components/store-tabs"

export const metadata: Metadata = {
  title: "Manage Store",
  description: "Manage your store.",
}

interface EditStorePageProps {
  params: {
    storeId: number
  }
}

export default async function EditStorePage({ params }: EditStorePageProps) {
  const { storeId } = params

  async function updateStore(fd: FormData) {
    "use server"

    const name = fd.get("name") as string
    const description = fd.get("description") as string

    const storeWithSameName = await db
      .select()
      .from(stores)
      .where(and(eq(stores.name, name), not(eq(stores.id, storeId))))

    if (storeWithSameName) {
      throw new Error("Store name already taken")
    }

    await db
      .update(stores)
      .set({ name, description })
      .where(eq(stores.id, storeId))

    revalidatePath(`/dashboard/stores/${storeId}`)
  }

  async function deleteStore() {
    "use server"

    await db.delete(stores).where(eq(stores.id, storeId))

    const path = "/dashboard"
    revalidatePath(path)
    redirect(path)
  }

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
    columns: {
      id: true,
      name: true,
      description: true,
    },
  })

  if (!store) {
    notFound()
  }

  return (
    <section className="container grid w-full items-center gap-6 pb-10 pt-6 md:py-10">
      <h1 className="text-3xl font-bold tracking-tight">{store.name}</h1>
      <div className="flex flex-col gap-4">
        <StoreTabs storeId={storeId} activeTab="store" />
        <form
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          action={updateStore}
          className="mx-auto grid w-full max-w-xl gap-5"
        >
          <fieldset className="grid gap-2.5">
            <Label htmlFor="update-store-name">Name</Label>
            <Input
              id="update-store-name"
              type="text"
              name="name"
              required
              minLength={3}
              maxLength={50}
              placeholder="Type store name here."
              defaultValue={store.name}
            />
          </fieldset>
          <fieldset className="grid gap-2.5">
            <Label htmlFor="update-store-description">Description</Label>
            <Textarea
              id="update-store-description"
              name="description"
              minLength={3}
              maxLength={255}
              placeholder="Type store description here."
              defaultValue={store.description ?? ""}
            />
          </fieldset>
          <LoadingButton>
            Update Store
            <span className="sr-only">Update Store</span>
          </LoadingButton>
          <LoadingButton
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            formAction={deleteStore}
            variant="destructive"
          >
            Delete Store
            <span className="sr-only">Delete Store</span>
          </LoadingButton>
        </form>
      </div>
    </section>
  )
}