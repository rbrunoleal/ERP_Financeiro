import Vue from 'vue/dist/vue.esm'
import TurbolinksAdapter from 'vue-turbolinks'
import VueResource from 'vue-resource'
import axios from 'axios'
import Toastr from 'vue-toastr';


Vue.use(VueResource)
Vue.use(TurbolinksAdapter)
Vue.component('vue-toastr', Toastr);

Vue.use(Toastr, {
  defaultTimeout: 3000,
  defaultProgressBar: false,
  defaultPosition: "toast-top-right",
  closeButton: true
  
});

const  URL = 'https://6f398da6b99543a289b25138de874ad2.vfs.cloud9.us-west-2.amazonaws.com/'

window.addEventListener('load', function () {
  axios.defaults.headers.common['X-CSRF-Token'] = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    const bancosIndex = new Vue({
      el: document.getElementById('bancosApp'),
      deleteBancoModal: document.getElementById('deleteBancoModal'),
      data: {
        create: false,
        clickedBanco: {},
        bancos: {},
        pickedBanco: {},
        showModal: false
      },
      mounted () {
        this.searchBancos();
      },
      methods: {
        mountCreateForm: function () {
          this.create = true;
          this.clickedBanco = {};
        },
        mountDeleteForm: function (banco) {
          this.clickedBanco = banco;
        },
        mountEditForm: function (banco) {
          this.create = false;
          this.clickedBanco = banco;
        },
        deleteBanco: function (id){
          console.log('bancos/'+id+'.json');
          axios
            .delete(`${URL}bancos/${id}.json`)
            .then(response => {
              this.searchBancos();
              this.$toastr.s("Registro apagado.");
            })
            .catch(error => {
              this.$toastr.e("Não foi possível excluir")
            })
            .finally(() => this.loading = false)
        },
        searchBancos: function(){
          this.clickedBanco = {}
          axios
            .get(`${URL}/bancos.json`)
            .then(response => {
              this.bancos = response.data
            })
            .catch(error => {
              this.errored = true
            })
              .finally(() => this.loading = false)
        },
        createBanco: function(banco){
          axios.post(`${URL}bancos.json`, {
            banco
          })
          .then(response => {
              this.searchBancos();
              this.$toastr.s("Registro criado.");
            })
            .catch(error => {
              this.$toastr.e("Não foi possível adicionar.");
            })
              .finally(() => this.loading = false)
        },
        updateBanco: function(banco){
          axios.put(`${URL}bancos/${banco.id}.json`, {
            banco
          })
          .then(response => {
              this.searchBancos();
              this.$toastr.s("Registro atualizado.");
            })
            .catch(error => {
              this.$toastr.e("Não foi possível adicionar.");
            })
              .finally(() => this.loading = false)
        }
      }
    })
}) 
