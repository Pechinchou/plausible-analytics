defmodule PlausibleWeb.Team.Notice do
  @moduledoc """
  Components with teams related notices.
  """
  use PlausibleWeb, :component
  import PlausibleWeb.Components.Icons

  alias Plausible.Teams
  alias PlausibleWeb.Components.PrimaDropdown

  def owner_cta_banner(assigns) do
    ~H"""
    <aside class="mt-4 mb-4">
      <.notice
        title="Uma Forma Melhor de Convidar Pessoas para Sua Equipe"
        class="shadow-md dark:shadow-none mt-4"
      >
        <p>
          Você também pode criar uma equipe e atribuir diferentes funções aos membros, como admin,
          editor, visualizador ou financeiro. Os membros da equipe terão acesso a todos os seus sites. <.styled_link href={
            Routes.team_setup_path(PlausibleWeb.Endpoint, :setup)
          }>
            Crie sua equipe aqui
          </.styled_link>.
        </p>
      </.notice>
    </aside>
    """
  end

  def guest_cta_banner(assigns) do
    ~H"""
    <aside class="mt-4 mb-4">
      <.notice
        title="Uma Forma Melhor de Convidar Pessoas para uma Equipe"
        class="shadow-md dark:shadow-none mt-4"
      >
        <p>
          Também é possível criar uma equipe e atribuir diferentes funções aos membros, como
          admin, editor, visualizador ou financeiro. Os membros da equipe podem ter acesso a todos os sites. Por favor,
          entre em contato com o proprietário do site para criar sua equipe.
        </p>
      </.notice>
    </aside>
    """
  end

  def team_members_notice(assigns) do
    ~H"""
    <aside class="mt-4 mb-4">
      <.notice theme={:gray} class="mt-4">
        <p>
          Os membros da equipe têm acesso automático a este site.
          <.styled_link href={Routes.settings_path(PlausibleWeb.Endpoint, :team_general)}>
            Ver membros da equipe
          </.styled_link>
        </p>
      </.notice>
    </aside>
    """
  end

  def team_invitations(assigns) do
    ~H"""
    <aside :if={not Enum.empty?(@team_invitations)} class="flex flex-col gap-y-4">
      <.notice
        :for={i <- @team_invitations}
        id={"invitation-#{i.invitation_id}"}
        title="Team invitation"
        theme={:white}
      >
        <:icon>
          <div class="shrink-0 -mt-1 bg-green-100/80 dark:bg-green-900/30 rounded-lg p-1.5">
            <.envelope_icon class="size-4 text-green-600 dark:text-green-400" />
          </div>
        </:icon>
        {i.inviter.name} convidou você para entrar em "{i.team.name}" como {i.role}.
        <:actions>
          <.button_link
            method="post"
            href={Routes.invitation_path(PlausibleWeb.Endpoint, :reject_invitation, i.invitation_id)}
            phx-value-invitation-id={i.invitation_id}
            theme="ghost"
            size="sm"
            class="order-2 md:order-1"
            mt?={false}
          >
            Recusar
          </.button_link>
          <.button_link
            method="post"
            href={Routes.invitation_path(PlausibleWeb.Endpoint, :accept_invitation, i.invitation_id)}
            theme="secondary"
            size="sm"
            class="order-1 md:order-2"
            mt?={false}
          >
            Aceitar
          </.button_link>
        </:actions>
      </.notice>
    </aside>
    """
  end

  def site_ownership_invitations(assigns) do
    ~H"""
    <aside :if={not Enum.empty?(@site_ownership_invitations)} class="flex flex-col gap-y-4">
      <.site_ownership_invitation
        :for={i <- @site_ownership_invitations}
        invitation={i}
        current_team={@current_team}
      />
    </aside>
    """
  end

  defp site_ownership_invitation(assigns) do
    {can_accept?, can_accept_without_members?, exceeded_limits} =
      case assigns.invitation.ownership_check do
        :ok ->
          {true, false, nil}

        {:error, {:over_plan_limits, limits}} ->
          {false, limits == [:team_member_limit], PlausibleWeb.TextHelpers.pretty_list(limits)}

        _ ->
          {false, false, nil}
      end

    assigns =
      assign(assigns,
        can_accept?: can_accept?,
        can_accept_without_members?: can_accept_without_members?,
        exceeded_limits: exceeded_limits
      )

    ~H"""
    <.notice
      id={"site-ownership-invitation-#{@invitation.transfer_id}"}
      title={"#{@invitation.initiator.name} has invited you to own #{@invitation.site.domain}"}
      theme={:white}
      icon_class="hidden md:block"
    >
      <:icon>
        <div class="shrink-0 -mt-1 bg-green-100/80 dark:bg-green-900/30 rounded-lg p-1.5">
          <.envelope_icon class="size-4 text-green-600 dark:text-green-400" />
        </div>
      </:icon>
      <p :if={@can_accept?}>
        Ao aceitar, você será responsável pela cobrança e este site entrará em "{Teams.name(
          @current_team
        )}"
      </p>
      <p :if={@invitation.ownership_check == {:error, :no_plan}} class="text-sm font-medium">
        Você não tem uma assinatura ativa. Faça upgrade para aceitar a propriedade e assumir a cobrança.
      </p>
      <p :if={@exceeded_limits} class="mt-1 text-sm font-medium">
        Isso excede seus limites atuais de {@exceeded_limits}. Faça upgrade para aceitar a propriedade.
      </p>
      <:actions>
        <.button_link
          method="post"
          href={
            Routes.invitation_path(
              PlausibleWeb.Endpoint,
              :reject_invitation,
              @invitation.transfer_id
            )
          }
          theme="ghost"
          size="sm"
          class="order-3 md:order-1"
          mt?={false}
        >
          Reject
        </.button_link>
        <.button_link
          :if={@can_accept?}
          method="post"
          href={
            Routes.invitation_path(
              PlausibleWeb.Endpoint,
              :accept_invitation,
              @invitation.transfer_id
            )
          }
          theme="secondary"
          size="sm"
          class="order-1 md:order-2"
          mt?={false}
        >
          Accept
        </.button_link>
        <PrimaDropdown.dropdown
          :if={@can_accept_without_members?}
          id={"ownership-accept-#{@invitation.transfer_id}"}
          class="order-1 md:order-2"
        >
          <PrimaDropdown.dropdown_trigger
            id={"ownership-accept-trigger-#{@invitation.transfer_id}"}
            theme="secondary"
            size="sm"
          >
            Accept <Heroicons.chevron_down mini class="size-4 mt-0.5" />
          </PrimaDropdown.dropdown_trigger>
          <PrimaDropdown.dropdown_menu id={"ownership-accept-menu-#{@invitation.transfer_id}"}>
            <PrimaDropdown.dropdown_item
              as={&link/1}
              id={"ownership-accept-item-upgrade-#{@invitation.transfer_id}"}
              href={Routes.billing_path(PlausibleWeb.Endpoint, :choose_plan)}
            >
              Fazer upgrade para aceitar
            </PrimaDropdown.dropdown_item>
            <PrimaDropdown.dropdown_item
              as={fn a -> link(Map.put(a, :method, "post")) end}
              id={"ownership-accept-item-members-#{@invitation.transfer_id}"}
              href={
                Routes.invitation_path(
                  PlausibleWeb.Endpoint,
                  :accept_invitation,
                  @invitation.transfer_id,
                  skip_site_members_transfer: "true"
                )
              }
            >
              Aceitar sem membros
            </PrimaDropdown.dropdown_item>
          </PrimaDropdown.dropdown_menu>
        </PrimaDropdown.dropdown>
        <.button_link
          :if={not @can_accept? and not @can_accept_without_members?}
          href={Routes.billing_path(PlausibleWeb.Endpoint, :choose_plan)}
          theme="secondary"
          size="sm"
          class="order-1 md:order-3"
          mt?={false}
        >
          Upgrade to accept
        </.button_link>
      </:actions>
    </.notice>
    """
  end

  def site_invitations(assigns) do
    ~H"""
    <aside :if={not Enum.empty?(@site_invitations)} class="flex flex-col gap-y-4">
      <.notice
        :for={i <- @site_invitations}
        id={"site-invitation-#{i.invitation_id}"}
        title={"Invitation to #{i.site.domain}"}
        theme={:white}
      >
        <:icon>
          <div class="shrink-0 -mt-1 bg-green-100/80 dark:bg-green-900/30 rounded-lg p-1.5">
            <.envelope_icon class="size-4 text-green-600 dark:text-green-400" />
          </div>
        </:icon>
        {i.team_invitation.inviter.name} convidou você para acessar o painel de analytics de {i.site.domain}
        como {i.role}.
        <:actions>
          <.button_link
            method="post"
            href={Routes.invitation_path(PlausibleWeb.Endpoint, :reject_invitation, i.invitation_id)}
            theme="ghost"
            size="sm"
            class="order-2 md:order-1"
            mt?={false}
          >
            Recusar
          </.button_link>
          <.button_link
            method="post"
            href={Routes.invitation_path(PlausibleWeb.Endpoint, :accept_invitation, i.invitation_id)}
            theme="secondary"
            size="sm"
            class="order-1 md:order-2"
            mt?={false}
          >
            Aceitar
          </.button_link>
        </:actions>
      </.notice>
    </aside>
    """
  end
end
