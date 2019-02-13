import Vue from 'vue/dist/vue.esm'
import TurbolinksAdapter from 'vue-turbolinks'
import VueResource from 'vue-resource'
import axios from 'axios'
import Toastr from 'vue-toastr';
import BootstrapVue from 'bootstrap-vue'
import { URL } from './env';
import vSelect from 'vue-select'

Vue.use(VueResource);
Vue.use(TurbolinksAdapter);
Vue.component('vue-toastr', Toastr);
Vue.component('v-select', vSelect)

Vue.use(Toastr, {
  defaultTimeout: 3000,
  defaultProgressBar: false,
  defaultPosition: "toast-top-right",
  closeButton: true
  
});
Vue.use(BootstrapVue);

window.addEventListener('turbolinks:load', function () {
  axios.defaults.headers.common['X-CSRF-Token'] = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    const movimentosIndex = new Vue({
      el: document.getElementById('movimentosApp'),
      data: {
        loading: true,
        create: false,
        clickedMovimento: {pessoa: {}, conta: {}, nota: {}},
        movimentos: [],
        pickedMovimento: {},
        showModal: false,
        allSelected: false,
        show: false,
        pessoas: [],
        contas: {},
        nota: false
      },
      mounted(){
        this.searchMovimentos();
        axios.get(`${URL}/contas.json`).then(response => {this.contas = response.data});
        axios.get(`${URL}/pessoas.json`).then(response => {this.pessoas = response.data});
      },
      methods: { 
        DataFormatada (data) {
          var date = new Date(data);
          var dataformatada = date.toLocaleDateString("pt-BR");
          return `${dataformatada}`
        },
        mountCreateForm: function () {
          this.$refs.formMovimentoModal.show();
          this.create = true;
          this.clickedMovimento = {pessoa: {}, conta: {}, nota: {}};
        },
        mountDeleteForm: function (movimento) {
          this.$refs.deleteMovimentoModal.show();
          this.clickedMovimento = movimento;
        },
        mountEditForm: function (movimento) {
          this.$refs.formMovimentoModal.show();
          this.create = false;
          this.clickedMovimento = {... movimento};
        },
        deleteMovimento: function (id){
          axios
            .delete(`${URL}/movimentos/${id}.json`)
            .then(response => {
              this.searchMovimentos();
              this.$toastr.s("Registro apagado.");
              this.$refs.deleteMovimentoModal.hide();
            })
            .catch(error => {
              this.$toastr.e("Não foi possível excluir")
            })
            .finally(() => this.loading = false)
        },
        searchMovimentos: function(){
          this.loading = true;
          this.clickedMovimento = {pessoa: {}, conta: {}, nota: {}};
          axios
            .get(`${URL}/movimentos.json`)
            .then(response => {
              this.movimentos = response.data
            })
            .catch(error => {
              this.errored = true
            })
              .finally(() => this.loading = false)
        },
        createMovimento: function(lmovimento){
          let movimento = {
            data_competencia: lmovimento.data_competencia,
            data_vencimento: lmovimento.data_vencimento,
            descricao: lmovimento.descricao,
            valor: lmovimento.valor,
            conta_id: lmovimento.conta_id,
            pessoa_id: lmovimento.pessoa.id,
            nota_attributes: lmovimento.nota
          };
        this.loading = true;
          axios.post(`${URL}/movimentos.json`, {
            movimento
          })
          .then(response => {
              this.$refs.formMovimentoModal.hide();
              this.searchMovimentos();
              this.$toastr.s("Registro criado.");
            })
            .catch(error => {
              this.$toastr.e("Não foi possível adicionar.");
            })
              .finally(() => this.loading = false)
        },
        updateMovimento: function(lmovimento){
          this.loading = true;
          let movimento = {
            id: lmovimento.id,
            data_competencia: lmovimento.data_competencia,
            data_vencimento: lmovimento.data_vencimento,
            descricao: lmovimento.descricao,
            valor: lmovimento.valor,
            conta_id: lmovimento.conta_id,
            pessoa_id: lmovimento.pessoa_id.id,
            nota_attributes: lmovimento.nota
          };
          axios.put(`${URL}/movimentos/${movimento.id}.json`, {
            movimento
          })
          .then(response => {
              this.$refs.formMovimentoModal.hide();
              this.searchMovimentos();
              this.$toastr.s("Registro atualizado.");
          })
          .catch(error => {
            this.$toastr.e("Não foi possível adicionar.");
          })
          .finally(() => this.loading = false)
        },
        selectAll: function() {
          this.allSelected ? this.movimentos.map( movimento  => movimento.selected = false) : this.movimentos.map( movimento  => movimento.selected = true);
        },
        select: function() {
          this.allSelected = false;
        },
        closeModal(){
          this.$refs.deleteMovimentoModal.hide();
          this.$refs.formMovimentoModal.hide()
        }
      }
    })
}) 
