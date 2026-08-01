import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { apiErrorMessage } from "../api/client";
import type { UserProfile } from "../api/types";
import { authErrorMessage } from "../auth/authErrors";
import { profileSchema, type ProfileValues } from "../auth/authSchemas";
import { useAuth } from "../auth/useAuth";
import { PageHeader } from "../components/PageHeader";
import { PageState } from "../components/PageState";
import { useAuthenticatedApi } from "../hooks/useAuthenticatedApi";

export function AccountPage() {
  const api = useAuthenticatedApi();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: ({ signal }) => api.getProfile(signal),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (profileQuery.data) reset({ username: profileQuery.data.username });
  }, [profileQuery.data, reset]);

  const profileMutation = useMutation({
    mutationFn: ({ username }: ProfileValues) => api.saveProfile(username),
    onSuccess(profile) {
      queryClient.setQueryData<UserProfile>(["profile"], profile);
      reset({ username: profile.username });
      toast.success("Perfil actualizado");
    },
    onError(error) {
      toast.error(apiErrorMessage(error));
    },
  });

  async function handleSignOut() {
    setSignOutError(null);
    try {
      queryClient.clear();
      await signOut();
    } catch (error) {
      setSignOutError(authErrorMessage(error));
    }
  }

  if (profileQuery.isError) {
    return (
      <PageState
        title="No pudimos cargar tu cuenta"
        message={apiErrorMessage(profileQuery.error)}
        error
        action={() => void profileQuery.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Cuenta"
        description="Administra tu identidad pública y la sesión actual."
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-800">
              <UserRound size={21} />
            </span>
            <div>
              <h2 className="font-bold">Perfil público</h2>
              <p className="text-sm text-zinc-500">
                Visible junto a tu actividad.
              </p>
            </div>
          </div>

          {profileQuery.isPending ? (
            <div className="h-28 animate-pulse rounded bg-zinc-100" />
          ) : (
            <form
              onSubmit={(event) =>
                void handleSubmit((values) => profileMutation.mutate(values))(
                  event,
                )
              }
            >
              <div className="field">
                <label htmlFor="account-username">Username</label>
                <input
                  id="account-username"
                  autoComplete="username"
                  aria-invalid={Boolean(errors.username)}
                  {...register("username")}
                />
                {errors.username && (
                  <span className="field-error">{errors.username.message}</span>
                )}
              </div>
              <button
                type="submit"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-50"
                disabled={!isDirty || profileMutation.isPending}
              >
                <Save size={17} />
                {profileMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-brand-700" size={23} />
            <h2 className="font-bold">Sesión</h2>
          </div>
          <div className="mt-6 flex min-w-0 items-center gap-3 border-y border-zinc-100 py-4">
            <Mail className="shrink-0 text-zinc-400" size={19} />
            <span className="min-w-0 truncate text-sm">{user?.email}</span>
          </div>
          {profileQuery.data && (
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              Cuenta creada el{" "}
              {new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(
                new Date(profileQuery.data.created_at),
              )}
            </p>
          )}
          {signOutError && (
            <div className="form-alert mt-4" role="alert">
              {signOutError}
            </div>
          )}
          <button
            type="button"
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-50"
            onClick={() => void handleSignOut()}
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </section>
      </div>
    </>
  );
}
