$(document).ready(function() {
	setInterval(ZonkyPlugin.renderCalculatedValues, 50);
});

var ZonkyPlugin = {
	interestRates: {
		'A**': 3.99,
		'A*' : 4.99,
		'A++': 5.99,
		'A+': 8.49,
		'A': 10.99,
		'B': 13.49,
		'C': 15.49,
		'D': 19.99
	},
	feeRates: {
		'A**': 1,
		'A*' : 1,
		'A++': 1,
		'A+': 1,
		'A': 1,
		'B': 1,
		'C': 1,
		'D': 1
	},
	newFeeRates: {
		'A**': 0.2,
		'A*' : 0.5,
		'A++': 1,
		'A+': 2.5,
		'A': 3,
		'B': 3.5,
		'C': 4,
		'D': 5
	},
	loanSize: 600,
	getInterestRate: function($el) {
		return this.interestRates[this.getRating($el)];
	},
	getFeeRate: function($el) {
		return this.newFeeRates[this.getRating($el)];
		// return this.feeRates[this.getRating($el)];
	},
	getRating: function($el) {
		return $el.find('[data-test-marketplace-index-item-summary="rating"] strong').text().trim();
	},
	getMonths: function($el) {
		var plain = $el.find('[data-test-marketplace-index-item-summary="term"]').text(),
			monthsString = plain.substring(0, plain.length - 7);
		
		return parseInt(monthsString);
	},
	rpad: function(number, decNumbers) {
		var stringNumber = this.round(number, decNumbers).toString(),
			dotPosition = stringNumber.indexOf('.');
		
		if (dotPosition === -1) {
			stringNumber += '.';
			dotPosition = stringNumber.length - 1;
		}
		
		stringNumber += '00000000000000';
		stringNumber = stringNumber.substr(0, dotPosition + decNumbers + 1);
		
		return stringNumber;
	},
	round: function(number, decNumber) {
		var a = Math.pow(10, decNumber);
		
		return Math.round(number * a) / a;
	},
	calculateRealInterestRate: function(months, realPaymentSize) {
		var it = 0,
			maxIt = 100,
			c1,
			cm,
			Im,
			I1 = 0,
			I2,
			search = true,
			found = 0,
			totalPaid = months * realPaymentSize;
		
		if (months > 0) {
			I2 = totalPaid / ZonkyPlugin.loanSize - 1;
		}
		else {
			search = false;
		}
		
		while (search && it < maxIt) {
			it++;
			Im = (I1 + I2) / 2;
			
			if (Math.abs(I2 - I1) <= 0.00005) {
				search = false;
				found = Im * 12 * 100;
			}
			else {
				c1 = this.calculateTotalInterestRate(I1, months, realPaymentSize);
				cm = this.calculateTotalInterestRate(Im, months, realPaymentSize);
				
				if (c1 > ZonkyPlugin.loanSize && cm < ZonkyPlugin.loanSize) {
					I2 = Im;
				} else {
					I1 = Im;
				}
			}
		}
		
		if (search) {
			return 0;
		}
		
		return found;
	},
	calculateTotalInterestRate: function(i, months, realPaymentSize) {
		var totalInterestRate;
		
		if (i) {
			totalInterestRate = realPaymentSize / (i * Math.pow(1 + i, months) / (Math.pow(1 + i, months) - 1));
		}
		else {
			totalInterestRate = realPaymentSize * months;
		}
		
		return totalInterestRate;
	},
	renderCalculatedValues: function() {
		$('.story-card').not('.zp_already-calculated').each(function() {
			var $this = $(this),
				interestRate = ZonkyPlugin.getInterestRate($this),
				feeRate = ZonkyPlugin.getFeeRate($this),
				months = ZonkyPlugin.getMonths($this);
			
			$this.addClass('zp_already-calculated');
			
			var i = interestRate * 1 / 12 / 100,
				anuit = ZonkyPlugin.loanSize * ( i*Math.pow(1+i, months) / (Math.pow(1+i, months)-1) );
			
			var investedRest = ZonkyPlugin.loanSize;
			var totalFee = 0;
			for (var a = 0; a < months; a++) {
				for (var day = 0; day < 30; day++) {
					totalFee += (investedRest * feeRate/100 / 365);
				}
				
				var monthlyInterest = investedRest * i;
				
				investedRest -= anuit - monthlyInterest;
			}
			
			var totalReturnment = anuit * months,
				realBenefit = totalReturnment - ZonkyPlugin.loanSize - totalFee,
				realBenefitAfterTax = realBenefit * 0.85,
				realPaymentSize = (ZonkyPlugin.loanSize + realBenefit) / months,
				realInterestRate = ZonkyPlugin.calculateRealInterestRate(months, realPaymentSize);
			
			$this.find('h3').after('<table class="zp_calculated-values">' +
				'<tr><th colspan="2">Info od Honzíka 👊</th></tr>' +
				'<tr><td>Investice:</td><td><strong>' + ZonkyPlugin.loanSize + ' Kč</strong></td></tr>' +
				'<tr><td>Výše splátky:</td><td><strong>' + ZonkyPlugin.rpad(anuit, 2) + ' Kč</strong></td></tr>' +
				'<tr><td>Celkově se mi vrátí:</td><td><strong>' + ZonkyPlugin.rpad(totalReturnment, 2) + ' Kč</strong></td></tr>' +
				'<tr><td>Poplatek Zonky:</td><td><strong>' + ZonkyPlugin.rpad(totalFee, 2) + ' Kč</strong></td></tr>' +
				'<tr><td>Reálný zisk:</td><td><strong>' + ZonkyPlugin.rpad(realBenefit, 2) + ' Kč</strong></td></tr>' +
				'<tr><td>Reálný zisk po <abbr title="15%">zdanění</abbr>:</td><td><strong>' + ZonkyPlugin.rpad(realBenefitAfterTax, 2) + ' Kč</strong></td></tr>' +
				'<tr><td><abbr title="z nezdaněného zisku">Reálný úrok p.a.</abbr>:</td><td><strong>' + ZonkyPlugin.rpad(realInterestRate, 2) + '%</strong></td></tr>' +
				'</table><br>')
		});
	}
};
