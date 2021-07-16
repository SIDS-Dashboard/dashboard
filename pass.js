var pass = document.getElementById('fname')

pass.addEventListener('input', function(e) {

//console.log(pass.value)

if(pass.value === 'island') {
document.getElementById('password').remove()
}
})