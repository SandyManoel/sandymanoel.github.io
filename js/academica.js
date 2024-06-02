document.addEventListener('DOMContentLoaded', function() {
    const btnAdicionarTarefa = document.getElementById('btnAdicionarTarefa');
    const btnCancelar = document.getElementById('btnCancelar');
    const tabela = document.getElementById('tabela').getElementsByTagName('tbody')[0];
    const pesquisa = document.getElementById('pesquisa');
    const mensagem = document.getElementById('mensagem');

    let db;
    const request = window.indexedDB.open('tarefas_academica', 1);

    request.onerror = function(event) {
        console.error('Erro ao abrir o banco de dados:', event.target.errorCode);
    };

    request.onsuccess = function(event) {
        console.log('Banco de dados aberto com sucesso');
        db = event.target.result;
        carregarTarefas();
    };

    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        const objectStore = db.createObjectStore('tarefas', { keyPath: 'id', autoIncrement: true });

        objectStore.createIndex('titulo', 'titulo', { unique: false });
        objectStore.createIndex('descricao', 'descricao', { unique: false });
        objectStore.createIndex('data', 'data', { unique: false });
        objectStore.createIndex('status', 'status', { unique: false });
        objectStore.createIndex('prioridade', 'prioridade', { unique: false });
        objectStore.createIndex('categoria', 'categoria', { unique: false });

        console.log('Banco de dados criado com sucesso');
    };

    function carregarTarefas() {
        
        const transaction = db.transaction(['tarefas'], 'readonly');
        const objectStore = transaction.objectStore('tarefas');
        const request = objectStore.getAll();

        request.onsuccess = function(event) {
            console.log('Todas as tarefas foram carregadas');
            const tarefas = event.target.result;
            exibirTarefas(tarefas);
        };
    }

    function exibirTarefas(tarefas) {
        
        tabela.innerHTML = ''; // Limpar tabela antes de carregar novos dados
        tarefas.forEach(tarefa => {
            const row = tabela.insertRow();
            row.id = `tarefa-${tarefa.id}`;
            row.insertCell(0).innerHTML = tarefa.id;
            row.insertCell(1).innerHTML = tarefa.titulo;
            row.insertCell(2).innerHTML = tarefa.descricao;
            row.insertCell(3).innerHTML = formatarData(tarefa.data);
            row.insertCell(4).innerHTML = tarefa.status;
            row.insertCell(5).innerHTML = tarefa.prioridade;
            row.insertCell(6).innerHTML = tarefa.categoria;
            row.insertCell(7).innerHTML = `<button onclick="editarTarefa(${tarefa.id})">Editar</button> <button onclick="excluirTarefa(${tarefa.id})">Excluir</button>`;
        });
    }

    function formatarData(data) {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    
    function adicionarTarefa(titulo, descricao, data, status, prioridade, categoria) {
        console.log("ADICIONANDO");
        const transaction = db.transaction(['tarefas'], 'readwrite');
        const objectStore = transaction.objectStore('tarefas');
        const novaTarefa = { titulo, descricao, data, status, prioridade, categoria };

        const request = objectStore.add(novaTarefa);
        request.onsuccess = function(event) {
            console.log('Nova tarefa adicionada com sucesso');
            carregarTarefas();
            exibirMensagem('Tarefa adicionada com sucesso!', 'sucesso');
        };

        request.onerror = function(event) {
            console.error('Erro ao adicionar a tarefa:', event.target.errorCode);
        };
    }


    btnAdicionarTarefa.addEventListener('click', function() {
        console.log("Botão de adicionar tarefa clicado");
        const titulo = document.getElementById('titulo').value;
        const descricao = document.getElementById('descricao').value;
        const data = document.getElementById('datavencimento').value;
        const status = document.getElementById('status').value;
        const prioridade = document.getElementById('prioridade').value;
        const categoria = document.getElementById('categoria').value;
    
        if (btnAdicionarTarefa.textContent === 'ADICIONAR TAREFA') {
            
            if (validarCampos(titulo, descricao, data, status, prioridade, categoria)) {
                console.log("Campos validados. Chamando adicionarTarefa()");
                adicionarTarefa(titulo, descricao, data, status, prioridade, categoria);
                // Limpar os campos após adicionar a tarefa
                document.getElementById('titulo').value = '';
                document.getElementById('descricao').value = '';
                document.getElementById('datavencimento').value = '';
                document.getElementById('status').value = '';
                document.getElementById('prioridade').value = '';
                document.getElementById('categoria').value = '';
            }
        } else if (btnAdicionarTarefa.textContent === 'Salvar') {
            console.log("Texto do botão: Salvar");
            salvarEdicaoTarefa();
        }
    });
    

    btnCancelar.addEventListener('click', function() {
        // Limpa os campos do formulário
        document.getElementById('titulo').value = '';
        document.getElementById('descricao').value = '';
        document.getElementById('datavencimento').value = '';
        document.getElementById('status').value = '';
        document.getElementById('prioridade').value = '';
        document.getElementById('categoria').value = '';
    
        // Atualiza o texto do botão Adicionar de volta para o padrão
        btnAdicionarTarefa.textContent = 'ADICIONAR TAREFA';
        // Define a função padrão do botão Adicionar
        btnAdicionarTarefa.onclick = adicionarTarefa;
    });

    pesquisa.addEventListener('input', function() {
        const termo = pesquisa.value.toLowerCase();
        const linhas = tabela.getElementsByTagName('tr');

        for (let i = 0; i < linhas.length; i++) {
            const celulas = linhas[i].getElementsByTagName('td');
            let encontrado = false;

            for (let j = 0; j < celulas.length - 1; j++) { // Excluir a última coluna de ações da pesquisa
                const conteudo = celulas[j].textContent.toLowerCase();
                if (conteudo.includes(termo)) {
                    encontrado = true;
                    break;
                }
            }

            if (encontrado) {
                linhas[i].style.display = '';
            } else {
                linhas[i].style.display = 'none';
            }
        }
    });

    window.excluirTarefa = function(id) {
        const transaction = db.transaction(['tarefas'], 'readwrite');
        const objectStore = transaction.objectStore('tarefas');
        const request = objectStore.delete(id);

        request.onsuccess = function(event) {
            console.log('Tarefa excluída com sucesso');
            carregarTarefas();
            exibirMensagem('Tarefa excluída com sucesso!', 'sucesso');
        };

        request.onerror = function(event) {
            console.error('Erro ao excluir a tarefa:', event.target.errorCode);
        };
    };

    window.editarTarefa = function(id) {
        const transaction = db.transaction(['tarefas'], 'readonly');
        const objectStore = transaction.objectStore('tarefas');
        const getRequest = objectStore.get(id);

        getRequest.onsuccess = function(event) {
            const tarefa = getRequest.result;
            if (tarefa) {
                // Preencher os campos do formulário com os dados da tarefa
                document.getElementById('titulo').value = tarefa.titulo;
                document.getElementById('descricao').value = tarefa.descricao;
                document.getElementById('datavencimento').value = tarefa.data;
                document.getElementById('status').value = tarefa.status;
                document.getElementById('prioridade').value = tarefa.prioridade;
                document.getElementById('categoria').value = tarefa.categoria;

                // Atualizar o botão para 'Salvar'
                btnAdicionarTarefa.textContent = 'Salvar';
                btnAdicionarTarefa.dataset.id = tarefa.id; // Salvar o ID da tarefa no botão
            } else {
                console.error('Tarefa não encontrada para edição');
                exibirMensagem('Tarefa não encontrada para edição. ID: ' + id, 'erro');
            }
        };

        getRequest.onerror = function(event) {
            console.error('Erro ao buscar a tarefa para edição:', event.target.errorCode);
            exibirMensagem('Erro ao buscar a tarefa para edição. Verifique o console para mais detalhes.', 'erro');
        };
    };

    function salvarEdicaoTarefa() {
        const id = parseInt(btnAdicionarTarefa.dataset.id, 10);
        const titulo = document.getElementById('titulo').value;
        const descricao = document.getElementById('descricao').value;
        const data = document.getElementById('datavencimento').value;
        const status = document.getElementById('status').value;
        const prioridade = document.getElementById('prioridade').value;
        const categoria = document.getElementById('categoria').value;

        const transaction = db.transaction(['tarefas'], 'readwrite');
        const objectStore = transaction.objectStore('tarefas');
        const getRequest = objectStore.get(id);

        getRequest.onsuccess = function(event) {
            const tarefa = getRequest.result;
            if (tarefa) {
                // Atualizar os dados da tarefa
                tarefa.titulo = titulo;
                tarefa.descricao = descricao;
                tarefa.data = data;
                tarefa.status = status;
                tarefa.prioridade = prioridade;
                tarefa.categoria = categoria;

                const updateRequest = objectStore.put(tarefa);

                updateRequest.onsuccess = function(event) {
                    console.log('Tarefa atualizada com sucesso');
                    carregarTarefas(); // Recarregar as tarefas na tabela
                    exibirMensagem('Tarefa atualizada com sucesso!', 'sucesso');
                };

                updateRequest.onerror = function(event) {
                    console.error('Erro ao atualizar a tarefa:', event.target.errorCode);
                    exibirMensagem('Erro ao atualizar a tarefa. Verifique o console para mais detalhes.', 'erro');
                };

                // Resetar os campos do formulário
                document.getElementById('titulo').value = '';
                document.getElementById('descricao').value = '';
                document.getElementById('datavencimento').value = '';
                document.getElementById('status').value = '';
                document.getElementById('prioridade').value = '';
                document.getElementById('categoria').value = '';

                // Mudar o botão de volta para "Adicionar"
                btnAdicionarTarefa.textContent = 'Adicionar';
                delete btnAdicionarTarefa.dataset.id; // Remover o ID da tarefa do botão
            } else {
                console.error('Tarefa não encontrada para atualização');
                exibirMensagem('Tarefa não encontrada para atualização. ID: ' + id, 'erro');
            }
        };

        getRequest.onerror = function(event) {
            console.error('Erro ao buscar a tarefa para atualização:', event.target.errorCode);
            exibirMensagem('Erro ao buscar a tarefa para atualização. Verifique o console para mais detalhes.', 'erro');
        };
    }

    function exibirMensagem(texto, tipo) {
        if (!mensagem) {
            console.error("Elemento de mensagem não encontrado");
            return;
        }
        mensagem.style.display = 'block';
        mensagem.textContent = texto;
        mensagem.style.color = tipo === 'erro' ? 'red' : 'green';
        setTimeout(() => {
            mensagem.style.display = 'none';
        }, 3000);
    }

    function validarCampos(titulo, descricao, data, status, prioridade, categoria) {
        if (!titulo || !descricao || !data || !status || !prioridade || !categoria) {
            exibirMensagem('Todos os campos são obrigatórios!', 'erro');
            return false;
        }
        return true;
    }
});
