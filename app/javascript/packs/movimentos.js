import Vue from 'vue/dist/vue.esm'
import TurbolinksAdapter from 'vue-turbolinks'
import VueResource from 'vue-resource'
import axios from 'axios'
import Toastr from 'vue-toastr';
import BootstrapVue from 'bootstrap-vue';
import { URL } from './env';
import vSelect from 'vue-select'
import jsPDF from 'jspdf'
import jsAutoTable from 'jspdf-autotable'

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

axios.defaults.headers.common['X-CSRF-Token'] = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
const movimentosIndex = new Vue({
  el: document.getElementById('movimentosApp'),
  data: {
    loading: true,
    create: false,
    clickedMovimento: {pessoa: {}, conta: {}, nota: {}},
    movimentos: [],
    showModal: false,
    allSelected: false,
    show: false,
    pessoas: [{id:'',nome:''}],
    contas: {},
    nota: false,
    total: 0,
    currentPage: 1,
    valor: '',
    pessoaId: '',
    dataCompetenciaInicio: '',
    dataCompetenciaFinal: ''
  },
  mounted(){
    this.searchMovimentos();
    axios.get(`${URL}/contas/all.json`).then(response => {this.contas = response.data});
    axios.get(`${URL}/pessoas/all.json`).then(response => {this.pessoas = response.data});
  },
  methods: {
    createPDF: function (){
      var lMovimentos = this.movimentos;
      var Columns = [
          {title: "Data Competência", dataKey: "dataCompetencia"},
          {title: "Data Vencimento", dataKey: "dataVencimento"},
          {title: "Favorecido/Sacado", dataKey: "favorecido"},
          {title: "Descrição", dataKey: "descricao"},
          {title: "Conta", dataKey: "conta"},
          {title: "Valor", dataKey: "valor"},
          {title: "Nota Fiscal", dataKey: "nota"},
      ];
      
      var Rows = lMovimentos.map(x => 
        ({  dataCompetencia: new Date(x.data_competencia + "T00:00:00").toLocaleDateString(),
            dataVencimento: new Date(x.data_vencimento + "T00:00:00").toLocaleDateString(),
            favorecido: x.favorecido,
            descricao: x.descricao,
            valor: x.valor,
            conta: x.contabancaria,
            nota: x.nota
        })
      );
      
      if(lMovimentos.length > 0){
        let pdfName = 'Movimentos'; 
        let pdfsize='a4';
        let doc = new jsPDF('l', 'pt', pdfsize);
        
        if(Rows.length > 0){
          doc.setFontStyle("bold");
          doc.setFontSize(20);
          doc.text("Relatório - Movimentos", 65, 25);
          doc.autoTable(Columns, Rows, {
          	theme: 'grid', 
          	headStyles: {
              fillColor: [0, 0, 0],
              textColor: [255, 255, 255]
            },
          	styles: {
              overflow: 'linebreak',
              cellWidth: 88
            },
            columnStyles: {
                0: {cellWidth: 200}
            }
          });
          doc.save(pdfName + ".pdf");
        }
      }
    },
    changePage: function(page) {
      if(page !== this.currentPage){
        this.currentPage = page;
        this.searchMovimentos();
      }
    },
    mountCreateForm: function () {
      this.$refs.formMovimentoModal.show();
      this.create = true;
      this.nota = false;
      this.clickedMovimento = {pessoa: {}, conta: {}, nota: {}};
    },
    mountDeleteForm: function (movimento) {
      this.$refs.deleteMovimentoModal.show();
      this.clickedMovimento = movimento;
    },
    mountShowModal: function (movimento){
      console.log(movimento);
      this.clickedMovimento = movimento;
      this.$refs.showMovimentoModal.show();
    },
    mountMultipleDeleteForm: function () {
      this.$refs.deleteMovimentoModal.show();
      this.selectedMovimentos = [];
      this.movimentos.map(movimento => {
        if (movimento.selected)
          return this.selectedMovimentos.push(movimento.id)
      });

    },
    mountEditForm: function (movimento) {
      this.$refs.formMovimentoModal.show();
      this.create = false;
      this.nota = false;
      if(!movimento.nota)
        movimento.nota = {};
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
          if (error.response.status === 422){
            error.response.data.errors.map(error => this.$toastr.e(error));
          }
          else{
            this.$toastr.e("Não foi possível excluir");
          }
        })
        .finally(() => this.loading = false)
    },
    searchMovimentos: function(){
      let filter = this.valor ? `valor=${this.valor}`:'';
      filter += this.dataCompetenciaInicio? `&dataCompetenciaInicio=${this.dataCompetenciaInicio}`:'';
      filter += this.dataCompetenciaFinal? `&dataCompetenciaFinal=${this.dataCompetenciaFinal}`:'';
      filter += this.pessoaId? `&pessoaId=${this.pessoaId.id}`:'';
      filter += `&page=${this.currentPage}`;
      this.loading = true;
      this.clickedMovimento = {pessoa: {}, conta: {}, nota: {}};
      axios
        .get(`${URL}/movimentos.json?${filter}`)
        .then(response => {
          this.movimentos = response.data.movimentos;
          this.total = response.data.total
        })
        .catch(error => {
          this.errored = true
        })
        .finally(() => this.loading = false)
    },
    createMovimento: function(movimento){
      movimento = {... movimento, nota_attributes: movimento.nota, pessoa_id: movimento.favorecido.id};
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
          if (error.response.status === 422){
            error.response.data.errors.map(error => this.$toastr.e(error));
          }
          else{
            this.$toastr.e("Não foi possível salvar as alterações");
          }
        })
        .finally(() => this.loading = false)
    },
    updateMovimento: function(movimento){
      this.loading = true;

      movimento = {... movimento, pessoa_id: movimento.favorecido.id, nota_attributes: movimento.nota};

      axios.put(`${URL}/movimentos/${movimento.id}.json`, {
        movimento
      })
        .then(response => {
          this.$refs.formMovimentoModal.hide();
          this.searchMovimentos();
          this.$toastr.s("Registro atualizado.");

        })
        .catch(error => {
          if (error.response.status === 422){
            error.response.data.errors.map(error => this.$toastr.e(error));
          }
          else{
            this.$toastr.e("Não foi possível atualizar as informações");
          }
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
      this.$refs.formMovimentoModal.hide();
      this.$refs.showMovimentoModal.hide();
    }
  }
});
