class MemosController < ApplicationController
  before_action :authenticate_request!

  def index
    memos = Memo.all
    render json: memos
  end

  def show
    memo = Memo.find(params[:id])
    render json: memo
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Memo not found" }, status: :not_found
  end

  def create
    memo = Memo.new(memo_params)

    if memo.save
      render json: memo, status: :created
    else
      render json: { errors: memo.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    memo = Memo.find(params[:id])

    if memo.update(memo_params)
      render json: memo
    else
      render json: { errors: memo.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Memo not found" }, status: :not_found
  end

  def destroy
    memo = Memo.find(params[:id])
    memo.destroy
    head :no_content
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Memo not found" }, status: :not_found
  end

  private

  def memo_params
    params.require(:memo).permit(:title, :content)
  end
end
