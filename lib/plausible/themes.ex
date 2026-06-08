defmodule Plausible.Themes do
  @options [
    [key: "Seguir tema do sistema", value: "system"],
    [key: "Claro", value: "light"],
    [key: "Escuro", value: "dark"]
  ]

  def options() do
    @options
  end
end
