document.addEventListener("DOMContentLoaded", function() {
    // Aguarda o carregamento do jQuery
    if (typeof jQuery !== "undefined") {
        // Máscara para celular
        $("input[name='num_celular']").mask("(00) 0 0000-0000");

        // Máscara dinâmica para CPF/CNPJ
        var cpfCnpjField = $("input[name='cpf_ou_cnpj']");

        cpfCnpjField.on("input", function() {
            var value = $(this).val().replace(/\D/g, ""); // Remove tudo que não for número
            if (value.length <= 11) {
                $(this).mask("000.000.000-00"); // Aplica máscara de CPF
            } else {
                $(this).mask("00.000.000/0000-00"); // Aplica máscara de CNPJ
            }
        });

        // Máscara para o CEP
        $("input[name='CEP']").mask("00000-000"); // Aplica máscara de CEP (00000-000)

        // Garantir que o campo de UF aceite apenas letras
        $("input[name='UF']").on("input", function() {
            // Substituir qualquer número ou caractere especial por uma string vazia
            this.value = this.value.replace(/[^A-Za-z]/g, "").toUpperCase(); // Só aceita letras e converte para maiúsculas
        });
        // Máscara para valores monetários
        $("input[name='desconto']").mask("#.##0,00", {reverse: true}); // Exemplo: R$ 5.000,00
        $("input[name='subtotal']").mask("#.##0,00", {reverse: true});  // Exemplo: R$ 10.000,00
        $("input[name='total_pagamento']").mask("#.##0,00", {reverse: true});  // Exemplo: R$ 50,00
        $("input[name='quantidade_produto'], input[name='quantidade_parcelas']").on("input", function() {
            // Remove qualquer caracter não numérico
            this.value = this.value.replace(/\D/g, "");
        });
    } else {
        console.error("jQuery não foi carregado corretamente!");
    }

    // Validação do CPF
    const cpfInput = document.querySelector("input[name='cpf_ou_cnpj']"); // Seleciona o input pelo name "cpf_ou_cnpj"
    const feedback = document.createElement("div");

    feedback.style.color = "red";
    feedback.style.fontSize = "14px";
    const campoCadCpf = cpfInput.closest('.campo-cad'); // Encontra o elemento mais próximo com a classe .campo-cad
    feedback.classList.add("feedback"); // Adiciona a classe feedback
    cpfInput.parentElement.appendChild(feedback);

    // Função para validar o CPF
    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, ''); // Remove qualquer caractere não numérico

        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false; // CPF inválido se tiver 11 dígitos iguais
        }

        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) {
            resto = 0;
        }
        if (resto !== parseInt(cpf.charAt(9))) {
            return false;
        }

        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) {
            resto = 0;
        }
        if (resto !== parseInt(cpf.charAt(10))) {
            return false;
        }

        return true;
    }

    // Evento de validação enquanto digita
    cpfInput.addEventListener("input", function() {
        const cpfValue = cpfInput.value.replace(/\D/g, ''); // Remove tudo que não for número

        if (cpfValue.length === 11) { // CPF completo deve ter 11 números (sem máscara)
            if (validarCPF(cpfValue)) {
                feedback.textContent = "CPF válido!";
                feedback.style.color = "green"; // Feedback positivo
            } else {
                feedback.textContent = "CPF inválido!";
                feedback.style.color = "red"; // Feedback negativo
            }
        } else {
            feedback.textContent = ""; // Limpa o feedback enquanto o CPF não estiver completo
        }

        // Diminuir o tamanho da fonte do feedback
        feedback.style.fontSize = "10px";
    });
});