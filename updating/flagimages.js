const fs = require('fs');
const Axios = require('axios');
const path = require('path');

let filepath = path.join(__dirname, '../utils/flags/name.png');
async function downloadImage(url, filepath) {
    const response = await Axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.open(filepath, 'w+', (err, desc) => {
            if (!err, desc) {
              //console.log(data, 'data');
              fs.writeFile(desc, 
                desc, (err) => {
                  // Rest of your code
                  if (err) throw err;
                  //console.log('Results Received');
                })
            }
          }))
            .on('error', reject)
            .once('close', () => resolve(filepath)); 
    });
}
let URL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAEZ0FNQQAAsY58+1GTAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAA79JREFUeNrtWc1PE1EQn90ulDa1pnwZSZBWkGDAcJGTGjxwo4lKwkckCB6MBy/lIFwbDhz0QBP/AJB4gZjoAfQgFyVqDFz4SPRCaKAGhUYSwJbSdp/vLRS27X68bRe6Jp1m2u7s2/d+M/ObebtZgLzkJSthpIyrq6t38U8/1utYrTnGGMI6j3XE5XK9VXXA7/c/Qwg9NWS0Gea50+kckHXgKPJvGEBxR+B9xPb7C8vGQkUACA715Cf5GIlmSdhR8uoIaRiXOI+A56z7exW3+e1LdwoRw3LYeE+cCS7FSUIbcKxNRexr76zJi9EsCLqPY6OhIvvKa4B47O+fy+3cEcZjB9gUBwjnwbbxiUmLVI7F9nOGFWOUc8B66PWeRTJaORT2YNcixihHIQnASCK9ZyXq63HUFyIlmwqv5ebNelw6hWTmyzLyadcj3dbhMp4IGaM+WH0iSkMfoziApAocaciUvo5y2fNYpy6VoaMZ1ICGFnsGdSLtQNsr3fu1LntBMELpgO2CMW/+g/4sakCDTE+vwOTkDzg4iAvHhYUm6Oiog9bW6jOiUBYyNPQZOI6F4eFmiMd5wWYyMfDy5TLMzf0Cr/eGAfYBhcgT8N3d9RAMhmBhYRMWFzdhayss2AoKWJiaWjGuA4Q2vb0NsL29DzMzfpidDQhK/hNbX18DTEx8Ny6FIpEYpg2CQGAHRz0E8/MbQidtaroI6+s7UFxcdFwXhswAEu094m2BYU7vjlzXDJjNJmBZBior7VBWZhUiTwCXllqx7ZxQzKQjGdaBzs6rMDa2BD09DdDSUoVpsyvYCXiHwwKjo0vQ1VVnXAqRPh+L8TA+vixkoLGxXFCSAWKLRnlwu2uMvQ94vTeFVjk4+DFpIyOR1xv8qe3Ebne1oMZ9oDGQSGbA6SuXaJFI4X4RKY4Xn5ezJ/qr1NiE7Vv7Mp0DiLJZqwHXCj4TDJpqACnc99MCVwKfsCMVm3oGKB9QpCZNvVYP8PplQEMd0AKnAa+07qnXAE3UacDLZYPTg/+0dMoUvGYKZVMDasAzAa+ER9IBCzAQVuE0ldNKdaARvEX6dV7aTkxeqMEVc3GYTCJWOdCJTxpwlahrjXytuSQsxijnAHkbCPer2ng1wLIRlwCuBJCWTg9c7bwYo5wDI+TrVv1jc3/Nw1CJyR5D+IYyoRBnjhSklT85l3yN6Jg/ORbPJXeulD0fHah9FGq+9sQsxnj8tJcaxP/tNWva853P5/vg8XgW8N8KrGVYC3KMm3D+K1aPy+V6AXnJi77yD3+Tgky3tfCHAAAAAElFTkSuQmCC'

downloadImage(URL,filepath)